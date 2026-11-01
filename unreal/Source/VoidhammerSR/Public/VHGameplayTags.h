// Voidhammer: The Shattered Realms. Native gameplay tags (stable ids: never rename, only add).
#pragma once

#include "NativeGameplayTags.h"

namespace VHTags
{
	// Embercraft price stages (World Book M1-M3: Toll, Debt, Arrears, Reckoning).
	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Price_Stage_Toll);
	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Price_Stage_Debt);
	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Price_Stage_Arrears);
	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Price_Stage_Reckoning);

	/** Permanent trait gained on first entry to Reckoning: no yield/kneel dialogue options ever again. */
	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Trait_AshTongued);

	/** SetByCaller magnitude for the Control cost GameplayEffect (M5). */
	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Data_Price_Control);

	VOIDHAMMERSR_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Ability_Embercraft_EmberWall);
}
