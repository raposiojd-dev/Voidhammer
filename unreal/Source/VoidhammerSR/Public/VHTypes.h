// Voidhammer: The Shattered Realms. Shared types and data-table rows.
// Every gameplay number lives in a data table or data asset; the defaults here
// mirror design/VERTICAL_SLICE_GDD_v1.md section 5 so the game runs before the
// tables exist.
#pragma once

#include "CoreMinimal.h"
#include "Engine/DataTable.h"
#include "VHTypes.generated.h"

/** Embercraft price stages (World Book M1-M3). Order matters: deeper = larger value. */
UENUM(BlueprintType)
enum class EVHPriceStage : uint8
{
	Toll      UMETA(DisplayName = "Toll"),
	Debt      UMETA(DisplayName = "Debt"),
	Arrears   UMETA(DisplayName = "Arrears"),
	Reckoning UMETA(DisplayName = "Reckoning")
};

UENUM(BlueprintType)
enum class EVHBattleState : uint8
{
	Idle,
	Deploy,
	Engaged,
	KaelrenVow,   // time slowed, waiting for the player's choice
	Resolved
};

UENUM(BlueprintType)
enum class EVHOrder : uint8
{
	Charge,
	Hold,
	FollowMe,
	Loose
};

/** Control thresholds for each stage. Control at or above DebtBelow is Toll. */
USTRUCT(BlueprintType)
struct FVHPriceThresholds
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Price") float DebtBelow = 70.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Price") float ArrearsBelow = 40.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Price") float ReckoningBelow = 15.f;
};

/** One row of DT_TroopTiers. Row name = stable troop id (e.g. "fb_t1_levy"). */
USTRUCT(BlueprintType)
struct FVHTroopTierRow : public FTableRowBase
{
	GENERATED_BODY()

	/** Shown to players. Proof Gate checks every string (no "god", Australian spelling). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") FText DisplayName;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") int32 Tier = 1;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") float Health = 60.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") float Armour = 10.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") float Attack = 10.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") bool bRanged = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") int32 UpgradeXP = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") int32 CostCrowns = 10;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") int32 UpkeepPerDay = 1;
	/** Row name of the tier this upgrades into (empty = top of line). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Troop") FName UpgradesTo;
};

/** Live state for one side in an abstract (numbers-only) battle. */
USTRUCT(BlueprintType)
struct FVHBattleSide
{
	GENERATED_BODY()

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Battle") int32 StartStrength = 0;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Battle") float Current = 0.f;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Battle") float Morale = 70.f;
	/** Fraction (0-1) of this side's units currently routing. */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Battle") float RoutingFraction = 0.f;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Battle") bool bCommanderPresent = true;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Battle") float AverageTier = 1.f;
};
