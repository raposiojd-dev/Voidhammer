// Voidhammer: The Shattered Realms. Ember Wall [PROPOSED name]: Embercraft, paid in self-control.
#pragma once

#include "CoreMinimal.h"
#include "Abilities/GameplayAbility.h"
#include "VHGA_EmberWall.generated.h"

/**
 * A line of fire in front of the caster. Stronger when the fight is hot (Heat),
 * and it costs Control (see UVHMagicCostComponent). GDD section 5.4.
 * v0 draws a debug line if WallActorClass is unset, so it is testable in greybox.
 */
UCLASS()
class VOIDHAMMERSR_API UVHGA_EmberWall : public UGameplayAbility
{
	GENERATED_BODY()

public:
	UVHGA_EmberWall();

	/** Blueprint actor that is the wall (fire VFX, burn volume, nav modifier). Optional in v0. */
	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Ember Wall")
	TSubclassOf<AActor> WallActorClass;

	/** Seconds the wall burns. */
	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Ember Wall") float DurationSeconds = 8.f;

	/** Distance in front of the caster where the wall's centre appears (cm). */
	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Ember Wall") float ForwardOffsetCm = 400.f;

	virtual void ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
		const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData) override;
};
