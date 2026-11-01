// Voidhammer: The Shattered Realms. GAS attribute set: vitals and the price of magic.
// Single-player: no replication. Clamping rules: GDD section 5.4.
#pragma once

#include "CoreMinimal.h"
#include "AttributeSet.h"
#include "AbilitySystemComponent.h"
#include "VHMagicCostAttributeSet.generated.h"

#define VH_ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
	GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)

/**
 * Health, Stamina, and the Embercraft price:
 *  - Control: self-control right now (0..ControlCeiling).
 *  - ControlCeiling: the most Control can ever recover to. Only ever goes down.
 *  - Heat: combat intensity 0-100. Calm Embercraft is weak Embercraft.
 *  - Faded: Shadowdeep identity erosion (Jorren's Unseen). Only ever goes up in the slice.
 */
UCLASS()
class VOIDHAMMERSR_API UVHMagicCostAttributeSet : public UAttributeSet
{
	GENERATED_BODY()

public:
	UVHMagicCostAttributeSet();

	UPROPERTY(BlueprintReadOnly, Category = "Vitals") FGameplayAttributeData Health;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, Health)

	UPROPERTY(BlueprintReadOnly, Category = "Vitals") FGameplayAttributeData MaxHealth;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, MaxHealth)

	UPROPERTY(BlueprintReadOnly, Category = "Vitals") FGameplayAttributeData Stamina;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, Stamina)

	UPROPERTY(BlueprintReadOnly, Category = "Price") FGameplayAttributeData Control;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, Control)

	UPROPERTY(BlueprintReadOnly, Category = "Price") FGameplayAttributeData ControlCeiling;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, ControlCeiling)

	UPROPERTY(BlueprintReadOnly, Category = "Price") FGameplayAttributeData Heat;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, Heat)

	UPROPERTY(BlueprintReadOnly, Category = "Price") FGameplayAttributeData Faded;
	VH_ATTRIBUTE_ACCESSORS(UVHMagicCostAttributeSet, Faded)

	virtual void PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue) override;
	virtual void PostGameplayEffectExecute(const struct FGameplayEffectModCallbackData& Data) override;

private:
	void ClampAttribute(const FGameplayAttribute& Attribute, float& Value) const;
};
