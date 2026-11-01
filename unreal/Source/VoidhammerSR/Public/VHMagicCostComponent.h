// Voidhammer: The Shattered Realms. The price of magic, made visible.
// Turns the Control attribute into a price stage, applies permanent ceiling
// losses once per stage, rolls surges, and gates dialogue (CanRefuseSelf).
// Numbers: GDD section 5.4. Rule: the price is always the virtue, overdone.
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GameplayEffectTypes.h"
#include "VHTypes.h"
#include "VHMagicCostComponent.generated.h"

class UAbilitySystemComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FVHOnPriceStageChanged, EVHPriceStage, OldStage, EVHPriceStage, NewStage);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FVHOnSurge);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FVHOnReckoningWarning, float, PendingCost);

UCLASS(ClassGroup = (Voidhammer), meta = (BlueprintSpawnableComponent))
class VOIDHAMMERSR_API UVHMagicCostComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UVHMagicCostComponent();

	/** Stage thresholds (Control). Defaults: Debt < 70, Arrears < 40, Reckoning < 15. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Price")
	FVHPriceThresholds Thresholds;

	/** Permanent ControlCeiling loss the first time each stage is entered. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Price") float CeilingLossOnDebt = 5.f;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Price") float CeilingLossOnArrears = 10.f;

	/** Chance per cast of a surge (a forced heavy attack), by stage: Toll, Debt, Arrears, Reckoning. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Price")
	TArray<float> SurgeChanceByStage = { 0.f, 0.15f, 0.35f, 0.60f };

	/** Set by the confirm dialog: the player has agreed to cross into Reckoning. Cleared after one cast. */
	UPROPERTY(BlueprintReadWrite, Category = "Price") bool bReckoningConfirmed = false;

	UPROPERTY(BlueprintAssignable, Category = "Price") FVHOnPriceStageChanged OnPriceStageChanged;
	UPROPERTY(BlueprintAssignable, Category = "Price") FVHOnSurge OnSurge;
	/** UI listens to this to show "This will cost you for good. Cast anyway?" */
	UPROPERTY(BlueprintAssignable, Category = "Price") FVHOnReckoningWarning OnReckoningWarning;

	UFUNCTION(BlueprintPure, Category = "Price") EVHPriceStage GetCurrentStage() const { return CurrentStage; }
	UFUNCTION(BlueprintPure, Category = "Price") EVHPriceStage GetDeepestStageReached() const { return DeepestStage; }
	UFUNCTION(BlueprintPure, Category = "Price") bool IsAshTongued() const { return bAshTongued; }

	/** Dialogue gate: "back down / yield / kneel" options are shown only while this is true. */
	UFUNCTION(BlueprintPure, Category = "Price") bool CanRefuseSelf() const;

	/** True if paying Cost now would take Control into Reckoning for the first time. */
	UFUNCTION(BlueprintPure, Category = "Price") bool WouldFirstEnterReckoning(float Cost) const;

	/**
	 * Pay Control. Returns false (and pays nothing) if there isn't enough Control,
	 * or if this would first enter Reckoning and the player hasn't confirmed.
	 * Rolls a surge after paying.
	 */
	UFUNCTION(BlueprintCallable, Category = "Price") bool PayPrice(float Cost);

	/** A night's rest (8 in-game hours). Toll/Debt: back to the ceiling. Arrears or worse: capped just under Debt. */
	UFUNCTION(BlueprintCallable, Category = "Price") void RestOneNight();

	UFUNCTION(BlueprintPure, Category = "Price") float GetControl() const;
	UFUNCTION(BlueprintPure, Category = "Price") float GetControlCeiling() const;

	/** Seed the surge roll (tests and replays). */
	void SetRandomSeed(int32 Seed) { Random.Initialize(Seed); }

protected:
	virtual void BeginPlay() override;

private:
	void OnControlChanged(const FOnAttributeChangeData& Data);
	void EnterStage(EVHPriceStage NewStage);
	void RefreshStageTags();
	UAbilitySystemComponent* GetASC() const;

	EVHPriceStage CurrentStage = EVHPriceStage::Toll;
	EVHPriceStage DeepestStage = EVHPriceStage::Toll;
	bool bAshTongued = false;
	FRandomStream Random;

	UPROPERTY(Transient) TObjectPtr<UAbilitySystemComponent> CachedASC;
};
