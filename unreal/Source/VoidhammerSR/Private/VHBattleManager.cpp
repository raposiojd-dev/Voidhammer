// Voidhammer: The Shattered Realms. Field battle state machine (stub).
#include "VHBattleManager.h"
#include "VoidhammerSR.h"
#include "VHBattleMath.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

AVHBattleManager::AVHBattleManager()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickInterval = 0.25f;
}

void AVHBattleManager::StartBattle(int32 PlayerTroops, int32 EnemyTroops)
{
	PlayerSide = FVHBattleSide();
	PlayerSide.StartStrength = FMath::Max(1, PlayerTroops);
	PlayerSide.Current = PlayerSide.StartStrength;
	PlayerSide.bCommanderPresent = true;
	PlayerSide.AverageTier = 1.6f;
	PlayerSide.Morale = FVHBattleMath::StartingMorale(true, PlayerSide.AverageTier);

	EnemySide = FVHBattleSide();
	EnemySide.StartStrength = FMath::Max(1, EnemyTroops);
	EnemySide.Current = EnemySide.StartStrength;
	EnemySide.bCommanderPresent = true;
	EnemySide.AverageTier = 1.3f;
	EnemySide.Morale = FVHBattleMath::StartingMorale(true, EnemySide.AverageTier);

	bPlayerCharging = bPlayerHolding = bVowDone = false;
	ElapsedSeconds = 0.f;
	State = EVHBattleState::Engaged;
	LogState(TEXT("Battle joined"));
}

void AVHBattleManager::IssueOrder(EVHOrder Order)
{
	bPlayerCharging = (Order == EVHOrder::Charge);
	bPlayerHolding = (Order == EVHOrder::Hold);
	UE_LOG(LogVoidhammer, Log, TEXT("Order: %s"), *UEnum::GetValueAsString(Order));
}

void AVHBattleManager::AddMoraleEvent(bool bPlayerSide, float Delta)
{
	FVHBattleSide& Side = bPlayerSide ? PlayerSide : EnemySide;
	Side.Morale = FMath::Clamp(Side.Morale + Delta, 0.f, 100.f);
}

void AVHBattleManager::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	if (State == EVHBattleState::Engaged)
	{
		StepSimulation(DeltaSeconds);
	}
}

void AVHBattleManager::StepSimulation(float Dt)
{
	ElapsedSeconds += Dt;

	auto MoraleFactor = [](const FVHBattleSide& S) { return FMath::Clamp(S.Morale / 70.f, 0.2f, 1.3f) * (1.f - S.RoutingFraction); };
	const float PlayerMult = bPlayerCharging ? ChargeKillMultiplier : 1.f;
	const float EnemyMult  = bPlayerCharging ? ChargeKillMultiplier : (bPlayerHolding ? 0.85f : 1.f);

	const float PlayerKills = BaseKillRatePer100 * PlayerSide.Current / 100.f * MoraleFactor(PlayerSide) * PlayerMult * Dt * 10.f;
	const float EnemyKills  = BaseKillRatePer100 * EnemySide.Current  / 100.f * MoraleFactor(EnemySide)  * EnemyMult  * Dt * 10.f;

	auto ApplyLoss = [this](FVHBattleSide& S, float Loss)
	{
		const float Before = S.Current;
		S.Current = FMath::Max(0.f, S.Current - Loss);
		const float PercentLost = 100.f * (Before - S.Current) / static_cast<float>(S.StartStrength);
		S.Morale = FMath::Clamp(S.Morale - PercentLost * MoralePerPercentLost, 0.f, 100.f);
	};
	ApplyLoss(EnemySide, PlayerKills);
	ApplyLoss(PlayerSide, EnemyKills);

	if (bPlayerHolding && PlayerSide.Morale < HoldRallyCap)
	{
		PlayerSide.Morale = FMath::Min(HoldRallyCap, PlayerSide.Morale + HoldRallyPerSecond * Dt);
	}

	UpdateRouting(PlayerSide);
	UpdateRouting(EnemySide);

	// Kaelren's vow: once, when the enemy reserve commits.
	if (!bVowDone && EnemySide.Current <= (1.f - VowTriggerEnemyLossFraction) * EnemySide.StartStrength)
	{
		State = EVHBattleState::KaelrenVow;
		UGameplayStatics::SetGlobalTimeDilation(this, VowTimeDilation);
		LogState(TEXT("Kaelren asks to ride (console: VHVow 1 = ride, VHVow 0 = pin)"));
		OnKaelrenVow.Broadcast();
		return;
	}

	const bool bEnemyBroken = FVHBattleMath::HasSideBroken(EnemySide);
	const bool bPlayerBroken = FVHBattleMath::HasSideBroken(PlayerSide);
	if (bEnemyBroken || bPlayerBroken)
	{
		Resolve(bEnemyBroken && !bPlayerBroken);
	}
}

void AVHBattleManager::UpdateRouting(FVHBattleSide& Side)
{
	// Abstract model: the share of units under rout morale grows as side morale falls toward it.
	const float Margin = Side.Morale - FVHBattleMath::RoutMorale;
	Side.RoutingFraction = Margin >= 20.f ? 0.f : FMath::Clamp(1.f - Margin / 20.f, 0.f, 1.f);
}

void AVHBattleManager::ResolveKaelrenVow(bool bLetHimRide)
{
	if (State != EVHBattleState::KaelrenVow)
	{
		return;
	}
	bVowDone = true;
	UGameplayStatics::SetGlobalTimeDilation(this, 1.f);

	if (bLetHimRide)
	{
		// Prototype rule: B.eCur *= 0.5. He is carried off wounded. He never dies (canon).
		EnemySide.Current *= RideEnemyStrengthMultiplier;
		AddMoraleEvent(false, -RideEnemyMoraleHit);
		OnKaelrenCarriedOff.Broadcast(KaelrenDaysOut);
		LogState(TEXT("Kaelren rode. Their line broke; four men carried him back on a shield"));
	}
	else
	{
		const int32 Lost = FMath::Min(PinFlankLosses, FMath::Max(0, FMath::FloorToInt(PlayerSide.Current) - 1));
		PlayerSide.Current -= Lost;
		LogState(TEXT("Pinned him with the warhorn. The right flank never heard the order"));
	}
	State = EVHBattleState::Engaged;
}

void AVHBattleManager::Resolve(bool bPlayerWon)
{
	State = EVHBattleState::Resolved;
	const int32 PlayerLosses = PlayerSide.StartStrength - FMath::RoundToInt(PlayerSide.Current);
	const int32 EnemyLosses = EnemySide.StartStrength - FMath::RoundToInt(EnemySide.Current);
	LogState(bPlayerWon ? TEXT("Their side breaks") : TEXT("Our side breaks"));
	// M4: hand results to the campaign layer (losses, loot, crowns, XP, story flags), as finishBattle does in the browser game.
	OnBattleResolved.Broadcast(bPlayerWon, PlayerLosses, EnemyLosses);
}

void AVHBattleManager::LogState(const TCHAR* Label) const
{
	UE_LOG(LogVoidhammer, Log, TEXT("[Battle %.1fs] %s. Ours %.0f/%d morale %.0f | Theirs %.0f/%d morale %.0f"),
		ElapsedSeconds, Label, PlayerSide.Current, PlayerSide.StartStrength, PlayerSide.Morale,
		EnemySide.Current, EnemySide.StartStrength, EnemySide.Morale);
}
