// Voidhammer: The Shattered Realms. Field battle state machine (stub).
// v0 simulates the battle as numbers (like the browser auto-resolve) so the
// morale, rout and vow rules can be tested before soldiers exist. M4 replaces
// the casualty model with real soldiers (Tier A characters + Tier B crowd
// instances, GDD 10.4) but keeps this class as the referee.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "VHTypes.h"
#include "VHBattleManager.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FVHOnBattleResolved, bool, bPlayerWon, int32, PlayerLosses, int32, EnemyLosses);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FVHOnKaelrenVow);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FVHOnKaelrenCarriedOff, int32, DaysOut);

UCLASS()
class VOIDHAMMERSR_API AVHBattleManager : public AActor
{
	GENERATED_BODY()

public:
	AVHBattleManager();

	UFUNCTION(BlueprintCallable, Category = "Battle") void StartBattle(int32 PlayerTroops, int32 EnemyTroops);
	UFUNCTION(BlueprintCallable, Category = "Battle") void IssueOrder(EVHOrder Order);

	/** Kaelren's vow (GDD 6.3). true = let him ride, false = pin him with the warhorn. */
	UFUNCTION(BlueprintCallable, Category = "Battle") void ResolveKaelrenVow(bool bLetHimRide);

	/** Morale events from gameplay (Ember Wall cast, commander downed...). Positive or negative. */
	UFUNCTION(BlueprintCallable, Category = "Battle") void AddMoraleEvent(bool bPlayerSide, float Delta);

	UFUNCTION(BlueprintPure, Category = "Battle") EVHBattleState GetState() const { return State; }
	UFUNCTION(BlueprintPure, Category = "Battle") FVHBattleSide GetPlayerSide() const { return PlayerSide; }
	UFUNCTION(BlueprintPure, Category = "Battle") FVHBattleSide GetEnemySide() const { return EnemySide; }

	UPROPERTY(BlueprintAssignable, Category = "Battle") FVHOnBattleResolved OnBattleResolved;
	UPROPERTY(BlueprintAssignable, Category = "Battle") FVHOnKaelrenVow OnKaelrenVow;
	UPROPERTY(BlueprintAssignable, Category = "Battle") FVHOnKaelrenCarriedOff OnKaelrenCarriedOff;

	// ---- Tuning (GDD 5.3 and 6.3) ----
	/** Soldiers each side removes per second per 100 of its own strength, at morale 70. */
	UPROPERTY(EditAnywhere, Category = "Tuning") float BaseKillRatePer100 = 1.2f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float ChargeKillMultiplier = 1.25f;
	/** The vow fires when the enemy has lost this fraction of its start (the reserve commits). */
	UPROPERTY(EditAnywhere, Category = "Tuning") float VowTriggerEnemyLossFraction = 0.25f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float VowTimeDilation = 0.3f;
	UPROPERTY(EditAnywhere, Category = "Tuning") int32 PinFlankLosses = 6;
	UPROPERTY(EditAnywhere, Category = "Tuning") float RideEnemyStrengthMultiplier = 0.5f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float RideEnemyMoraleHit = 25.f;
	UPROPERTY(EditAnywhere, Category = "Tuning") int32 KaelrenDaysOut = 12;
	UPROPERTY(EditAnywhere, Category = "Tuning") float HoldRallyPerSecond = 1.f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float HoldRallyCap = 40.f;
	/** Morale lost per 1% of own start strength lost. */
	UPROPERTY(EditAnywhere, Category = "Tuning") float MoralePerPercentLost = 0.6f;

	virtual void Tick(float DeltaSeconds) override;

private:
	void StepSimulation(float Dt);
	void UpdateRouting(FVHBattleSide& Side);
	void Resolve(bool bPlayerWon);
	void LogState(const TCHAR* Label) const;

	UPROPERTY(VisibleAnywhere, Category = "Battle") EVHBattleState State = EVHBattleState::Idle;
	UPROPERTY(VisibleAnywhere, Category = "Battle") FVHBattleSide PlayerSide;
	UPROPERTY(VisibleAnywhere, Category = "Battle") FVHBattleSide EnemySide;

	bool bPlayerCharging = false;
	bool bPlayerHolding = false;
	bool bVowDone = false;
	float ElapsedSeconds = 0.f;
};
