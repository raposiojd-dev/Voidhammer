// Voidhammer: The Shattered Realms. Slice game mode.
#include "VHGameMode.h"
#include "VHPlayerCharacter.h"

AVHGameMode::AVHGameMode()
{
	DefaultPawnClass = AVHPlayerCharacter::StaticClass();
}
