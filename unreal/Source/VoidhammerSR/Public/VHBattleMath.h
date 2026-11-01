// Voidhammer: The Shattered Realms. Pure, deterministic formulas.
// No UObjects, no randomness, no world: every function here is unit-tested in
// Private/Tests/VHBattleMathTests.cpp. Numbers: GDD section 5.
#pragma once

#include "CoreMinimal.h"
#include "VHTypes.h"

struct VOIDHAMMERSR_API FVHBattleMath
{
	/** Damage after armour: Damage * 100 / (100 + Armour). Negative armour is treated as 0. */
	static float MitigateDamage(float Damage, float Armour);

	/** Block: frontal hits are reduced by BlockReduction (0.8 = -80%, the prototype value). */
	static float ApplyBlock(float Damage, bool bBlocking, bool bPerfectBlock, float BlockReduction = 0.8f);

	/** Start morale: 70, +10 with commander, +5 per tier above 1, clamped 0-100. */
	static float StartingMorale(bool bCommanderPresent, float AverageTier);

	/** A unit routs below this morale. */
	static constexpr float RoutMorale = 20.f;
	/** A routed unit can rally at this morale. */
	static constexpr float RallyMorale = 35.f;

	/**
	 * A side breaks when >= 60% of its units are routing, or its strength is under
	 * 33% of its start (the browser prototype's "about a third" rule).
	 */
	static bool HasSideBroken(const FVHBattleSide& Side, float RoutingBreakFraction = 0.6f, float StrengthBreakFraction = 0.33f);

	/** Embercraft price stage for a Control value. */
	static EVHPriceStage StageForControl(float Control, const FVHPriceThresholds& Thresholds);

	/** Ember Wall: calm Embercraft is weak Embercraft. Length = 8 + 0.08 * Heat metres. */
	static float EmberWallLengthMetres(float Heat);

	/** Ember Wall burn: 25 * (0.6 + 0.004 * Heat) damage per second. */
	static float EmberWallBurnPerSecond(float Heat);

	/** Ember Wall price: 12 + 0.1 * Heat Control. */
	static float EmberWallControlCost(float Heat);

	/** Party size cap: 30 + 10 * Leadership (1-10), +10 with Kaelren. */
	static int32 PartySizeCap(int32 Leadership, bool bKaelrenInParty);
};
