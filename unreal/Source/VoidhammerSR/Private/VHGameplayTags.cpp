// Voidhammer: The Shattered Realms. Native gameplay tags.
#include "VHGameplayTags.h"

namespace VHTags
{
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Price_Stage_Toll, "Price.Stage.Toll", "Embercraft price: Toll. Recovers with rest.");
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Price_Stage_Debt, "Price.Stage.Debt", "Embercraft price: Debt. Ceiling loss, surges, no backing down.");
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Price_Stage_Arrears, "Price.Stage.Arrears", "Embercraft price: Arrears. Deeper ceiling loss, rest capped.");
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Price_Stage_Reckoning, "Price.Stage.Reckoning", "Embercraft price: Reckoning. Ash-tongued, permanent.");
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Trait_AshTongued, "Trait.AshTongued", "Can no longer refuse yourself. Permanent for this save.");
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Data_Price_Control, "Data.Price.Control", "SetByCaller: Control paid for a cast.");
	UE_DEFINE_GAMEPLAY_TAG_COMMENT(Ability_Embercraft_EmberWall, "Ability.Embercraft.EmberWall", "Ember Wall [PROPOSED name].");
}
