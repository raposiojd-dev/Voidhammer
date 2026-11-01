// Voidhammer: The Shattered Realms. GAS attribute set.
#include "VHMagicCostAttributeSet.h"
#include "GameplayEffectExtension.h"

UVHMagicCostAttributeSet::UVHMagicCostAttributeSet()
{
	InitHealth(100.f);
	InitMaxHealth(100.f);
	InitStamina(100.f);
	InitControl(100.f);
	InitControlCeiling(100.f);
	InitHeat(0.f);
	InitFaded(0.f);
}

void UVHMagicCostAttributeSet::ClampAttribute(const FGameplayAttribute& Attribute, float& Value) const
{
	if (Attribute == GetHealthAttribute())
	{
		Value = FMath::Clamp(Value, 0.f, GetMaxHealth());
	}
	else if (Attribute == GetStaminaAttribute() || Attribute == GetHeatAttribute())
	{
		Value = FMath::Clamp(Value, 0.f, 100.f);
	}
	else if (Attribute == GetControlAttribute())
	{
		Value = FMath::Clamp(Value, 0.f, GetControlCeiling());
	}
	else if (Attribute == GetControlCeilingAttribute())
	{
		// The ceiling never rises: "nothing undoes a Late price" (World Book M2).
		Value = FMath::Clamp(Value, 0.f, GetControlCeiling());
	}
	else if (Attribute == GetFadedAttribute())
	{
		Value = FMath::Clamp(Value, GetFaded(), 99.f);
	}
}

void UVHMagicCostAttributeSet::PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue)
{
	Super::PreAttributeChange(Attribute, NewValue);
	ClampAttribute(Attribute, NewValue);
}

void UVHMagicCostAttributeSet::PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data)
{
	Super::PostGameplayEffectExecute(Data);

	// Base values changed by instant effects: clamp them the same way.
	if (Data.EvaluatedData.Attribute == GetHealthAttribute())
	{
		SetHealth(FMath::Clamp(GetHealth(), 0.f, GetMaxHealth()));
	}
	else if (Data.EvaluatedData.Attribute == GetControlAttribute())
	{
		SetControl(FMath::Clamp(GetControl(), 0.f, GetControlCeiling()));
	}
	else if (Data.EvaluatedData.Attribute == GetControlCeilingAttribute())
	{
		// If the ceiling dropped under current Control, pull Control down with it.
		SetControl(FMath::Min(GetControl(), GetControlCeiling()));
	}
}
