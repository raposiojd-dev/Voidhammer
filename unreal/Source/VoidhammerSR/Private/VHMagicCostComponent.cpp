// Voidhammer: The Shattered Realms. The price of magic, made visible.
#include "VHMagicCostComponent.h"
#include "VoidhammerSR.h"
#include "VHBattleMath.h"
#include "VHGameplayTags.h"
#include "VHMagicCostAttributeSet.h"
#include "AbilitySystemComponent.h"
#include "AbilitySystemInterface.h"

UVHMagicCostComponent::UVHMagicCostComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
	Random.GenerateNewSeed();
}

void UVHMagicCostComponent::BeginPlay()
{
	Super::BeginPlay();

	if (UAbilitySystemComponent* ASC = GetASC())
	{
		ASC->GetGameplayAttributeValueChangeDelegate(UVHMagicCostAttributeSet::GetControlAttribute())
			.AddUObject(this, &UVHMagicCostComponent::OnControlChanged);
		CurrentStage = FVHBattleMath::StageForControl(GetControl(), Thresholds);
		RefreshStageTags();
	}
	else
	{
		UE_LOG(LogVoidhammer, Warning, TEXT("%s: no AbilitySystemComponent on owner; magic costs disabled."), *GetNameSafe(GetOwner()));
	}
}

UAbilitySystemComponent* UVHMagicCostComponent::GetASC() const
{
	if (CachedASC)
	{
		return CachedASC;
	}
	if (const IAbilitySystemInterface* ASI = Cast<IAbilitySystemInterface>(GetOwner()))
	{
		const_cast<UVHMagicCostComponent*>(this)->CachedASC = ASI->GetAbilitySystemComponent();
	}
	return CachedASC;
}

float UVHMagicCostComponent::GetControl() const
{
	const UAbilitySystemComponent* ASC = GetASC();
	return ASC ? ASC->GetNumericAttribute(UVHMagicCostAttributeSet::GetControlAttribute()) : 100.f;
}

float UVHMagicCostComponent::GetControlCeiling() const
{
	const UAbilitySystemComponent* ASC = GetASC();
	return ASC ? ASC->GetNumericAttribute(UVHMagicCostAttributeSet::GetControlCeilingAttribute()) : 100.f;
}

bool UVHMagicCostComponent::CanRefuseSelf() const
{
	return !bAshTongued && CurrentStage == EVHPriceStage::Toll;
}

bool UVHMagicCostComponent::WouldFirstEnterReckoning(float Cost) const
{
	if (DeepestStage == EVHPriceStage::Reckoning)
	{
		return false;
	}
	return FVHBattleMath::StageForControl(GetControl() - Cost, Thresholds) == EVHPriceStage::Reckoning;
}

bool UVHMagicCostComponent::PayPrice(float Cost)
{
	UAbilitySystemComponent* ASC = GetASC();
	if (!ASC || Cost < 0.f || GetControl() < Cost)
	{
		return false;
	}
	if (WouldFirstEnterReckoning(Cost) && !bReckoningConfirmed)
	{
		OnReckoningWarning.Broadcast(Cost);
		return false;
	}
	bReckoningConfirmed = false;

	// v0: direct modifier. M5 swaps this for GE_EmberWallCost with SetByCaller Data.Price.Control
	// so costs show in the GAS debugger (showdebug abilitysystem).
	ASC->ApplyModToAttribute(UVHMagicCostAttributeSet::GetControlAttribute(), EGameplayModOp::Additive, -Cost);

	const int32 StageIndex = static_cast<int32>(CurrentStage);
	const float SurgeChance = SurgeChanceByStage.IsValidIndex(StageIndex) ? SurgeChanceByStage[StageIndex] : 0.f;
	if (SurgeChance > 0.f && Random.FRand() < SurgeChance)
	{
		UE_LOG(LogVoidhammer, Log, TEXT("Surge (stage %d)."), StageIndex);
		OnSurge.Broadcast();
	}
	return true;
}

void UVHMagicCostComponent::RestOneNight()
{
	UAbilitySystemComponent* ASC = GetASC();
	if (!ASC)
	{
		return;
	}
	float Target = GetControlCeiling();
	if (CurrentStage >= EVHPriceStage::Arrears)
	{
		Target = FMath::Min(Target, Thresholds.DebtBelow - 1.f);
	}
	const float Delta = Target - GetControl();
	if (Delta > 0.f)
	{
		ASC->ApplyModToAttribute(UVHMagicCostAttributeSet::GetControlAttribute(), EGameplayModOp::Additive, Delta);
	}
}

void UVHMagicCostComponent::OnControlChanged(const FOnAttributeChangeData& Data)
{
	const EVHPriceStage NewStage = FVHBattleMath::StageForControl(Data.NewValue, Thresholds);
	if (NewStage != CurrentStage)
	{
		EnterStage(NewStage);
	}
}

void UVHMagicCostComponent::EnterStage(EVHPriceStage NewStage)
{
	const EVHPriceStage OldStage = CurrentStage;
	CurrentStage = NewStage;

	// First time deeper than ever before: the permanent part of the price.
	if (NewStage > DeepestStage)
	{
		UAbilitySystemComponent* ASC = GetASC();
		for (int32 S = static_cast<int32>(DeepestStage) + 1; S <= static_cast<int32>(NewStage); ++S)
		{
			const EVHPriceStage Reached = static_cast<EVHPriceStage>(S);
			float Loss = 0.f;
			if (Reached == EVHPriceStage::Debt)    Loss = CeilingLossOnDebt;
			if (Reached == EVHPriceStage::Arrears) Loss = CeilingLossOnArrears;
			if (Reached == EVHPriceStage::Reckoning)
			{
				bAshTongued = true;
				if (ASC) ASC->AddLooseGameplayTag(VHTags::Trait_AshTongued);
			}
			if (ASC && Loss > 0.f)
			{
				ASC->ApplyModToAttribute(UVHMagicCostAttributeSet::GetControlCeilingAttribute(), EGameplayModOp::Additive, -Loss);
			}
		}
		DeepestStage = NewStage;
	}

	RefreshStageTags();
	OnPriceStageChanged.Broadcast(OldStage, NewStage);
}

void UVHMagicCostComponent::RefreshStageTags()
{
	UAbilitySystemComponent* ASC = GetASC();
	if (!ASC)
	{
		return;
	}
	const FGameplayTag StageTags[] = {
		VHTags::Price_Stage_Toll, VHTags::Price_Stage_Debt, VHTags::Price_Stage_Arrears, VHTags::Price_Stage_Reckoning };
	for (int32 i = 0; i < 4; ++i)
	{
		ASC->SetLooseGameplayTagCount(StageTags[i], i == static_cast<int32>(CurrentStage) ? 1 : 0);
	}
}
