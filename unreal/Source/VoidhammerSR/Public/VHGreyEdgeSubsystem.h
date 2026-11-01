// Voidhammer: The Shattered Realms. Grey edges: the Void on the world map (GDD section 8).
// Canon: no rifts before ~576 YB1 and no Voidborn. In this era
// grey edges are rare and faint. This subsystem enforces that with hard caps.
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "VHGreyEdgeSubsystem.generated.h"

UCLASS()
class VOIDHAMMERSR_API UVHGreyEdgeSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	/** Reset the map to NumCells clean cells (slice: about 40). */
	UFUNCTION(BlueprintCallable, Category = "Grey Edges") void ResetCells(int32 NumCells, int32 Seed = 1);

	/** Advance one in-game day: spread, decay under Kept Coals, caps. */
	UFUNCTION(BlueprintCallable, Category = "Grey Edges") void AdvanceDay();

	/** A battle with heavy deaths in a cell: "only fear is loud". */
	UFUNCTION(BlueprintCallable, Category = "Grey Edges") void AddFearEvent(int32 Cell, int32 Deaths);

	/** Light a Kept Coal in the cell's village (50 crowns, 1 day, lasts 60 days). */
	UFUNCTION(BlueprintCallable, Category = "Grey Edges") void LightKeptCoal(int32 Cell, int32 Days = 60);

	/** Seed a faint edge (story trigger). Still obeys the caps. */
	UFUNCTION(BlueprintCallable, Category = "Grey Edges") void SeedEdge(int32 Cell, float Amount);

	UFUNCTION(BlueprintPure, Category = "Grey Edges") float GetGrey(int32 Cell) const;
	UFUNCTION(BlueprintPure, Category = "Grey Edges") bool IsFaintOrWorse(int32 Cell) const { return GetGrey(Cell) >= FaintThreshold; }

	/** Story-stage cap (Spec ovVCap): in the slice, grey can quiet 0 holds. Never a capital or a realm's last two holds. */
	UFUNCTION(BlueprintPure, Category = "Grey Edges") bool CanQuietHold() const { return false; }

	// ---- Tuning ----
	UPROPERTY(EditAnywhere, Category = "Tuning") float CapPerCell = 15.f;
	UPROPERTY(EditAnywhere, Category = "Tuning") int32 MaxCellsAboveFaint = 2;
	UPROPERTY(EditAnywhere, Category = "Tuning") float FaintThreshold = 5.f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float SpreadPerDay = 0.5f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float SpreadChance = 0.25f;
	UPROPERTY(EditAnywhere, Category = "Tuning") float KeptCoalDecayPerDay = 1.f;
	UPROPERTY(EditAnywhere, Category = "Tuning") int32 FearDeathsThreshold = 100;
	UPROPERTY(EditAnywhere, Category = "Tuning") float FearGreyGain = 3.f;

private:
	void AddGreyCapped(int32 Cell, float Amount);
	int32 CountAboveFaint() const;

	TArray<float> Grey;
	TArray<int32> KeptCoalDaysLeft;
	FRandomStream Random;
	// M3: write Grey into a 64x64 render target for the map post-process (desaturate + "unfinished" edge).
};
