// Voidhammer: The Shattered Realms. Pure, deterministic formulas.
#include "VHBattleMath.h"

float FVHBattleMath::MitigateDamage(float Damage, float Armour)
{
	const float A = FMath::Max(0.f, Armour);
	return FMath::Max(0.f, Damage) * 100.f / (100.f + A);
}

float FVHBattleMath::ApplyBlock(float Damage, bool bBlocking, bool bPerfectBlock, float BlockReduction)
{
	if (bPerfectBlock)
	{
		return 0.f;
	}
	return bBlocking ? Damage * (1.f - FMath::Clamp(BlockReduction, 0.f, 1.f)) : Damage;
}

float FVHBattleMath::StartingMorale(bool bCommanderPresent, float AverageTier)
{
	const float TierBonus = 5.f * FMath::Max(0.f, AverageTier - 1.f);
	return FMath::Clamp(70.f + (bCommanderPresent ? 10.f : 0.f) + TierBonus, 0.f, 100.f);
}

bool FVHBattleMath::HasSideBroken(const FVHBattleSide& Side, float RoutingBreakFraction, float StrengthBreakFraction)
{
	if (Side.StartStrength <= 0)
	{
		return true;
	}
	if (Side.RoutingFraction >= RoutingBreakFraction)
	{
		return true;
	}
	return Side.Current < StrengthBreakFraction * static_cast<float>(Side.StartStrength);
}

EVHPriceStage FVHBattleMath::StageForControl(float Control, const FVHPriceThresholds& T)
{
	if (Control < T.ReckoningBelow) return EVHPriceStage::Reckoning;
	if (Control < T.ArrearsBelow)   return EVHPriceStage::Arrears;
	if (Control < T.DebtBelow)      return EVHPriceStage::Debt;
	return EVHPriceStage::Toll;
}

float FVHBattleMath::EmberWallLengthMetres(float Heat)
{
	return 8.f + 0.08f * FMath::Clamp(Heat, 0.f, 100.f);
}

float FVHBattleMath::EmberWallBurnPerSecond(float Heat)
{
	return 25.f * (0.6f + 0.004f * FMath::Clamp(Heat, 0.f, 100.f));
}

float FVHBattleMath::EmberWallControlCost(float Heat)
{
	return 12.f + 0.1f * FMath::Clamp(Heat, 0.f, 100.f);
}

int32 FVHBattleMath::PartySizeCap(int32 Leadership, bool bKaelrenInParty)
{
	return 30 + 10 * FMath::Clamp(Leadership, 1, 10) + (bKaelrenInParty ? 10 : 0);
}
