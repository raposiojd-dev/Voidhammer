// Voidhammer: The Shattered Realms. Slice game mode.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "VHGameMode.generated.h"

/** Default game mode for every slice map: spawns AVHPlayerCharacter. */
UCLASS()
class VOIDHAMMERSR_API AVHGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	AVHGameMode();
};
