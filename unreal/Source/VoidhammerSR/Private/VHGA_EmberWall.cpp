// Voidhammer: The Shattered Realms. Ember Wall ability.
#include "VHGA_EmberWall.h"
#include "VoidhammerSR.h"
#include "VHBattleMath.h"
#include "VHGameplayTags.h"
#include "VHMagicCostAttributeSet.h"
#include "VHMagicCostComponent.h"
#include "AbilitySystemComponent.h"
#include "DrawDebugHelpers.h"
#include "Engine/World.h"
#include "GameFramework/Actor.h"

UVHGA_EmberWall::UVHGA_EmberWall()
{
	InstancingPolicy = EGameplayAbilityInstancingPolicy::InstancedPerActor;
	FGameplayTagContainer Tags;
	Tags.AddTag(VHTags::Ability_Embercraft_EmberWall);
	SetAssetTags(Tags);
}

void UVHGA_EmberWall::ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
	const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData)
{
	AActor* Avatar = ActorInfo ? ActorInfo->AvatarActor.Get() : nullptr;
	UAbilitySystemComponent* ASC = ActorInfo ? ActorInfo->AbilitySystemComponent.Get() : nullptr;
	UVHMagicCostComponent* Price = Avatar ? Avatar->FindComponentByClass<UVHMagicCostComponent>() : nullptr;
	if (!Avatar || !ASC || !Price || !CommitAbility(Handle, ActorInfo, ActivationInfo))
	{
		EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
		return;
	}

	const float Heat = ASC->GetNumericAttribute(UVHMagicCostAttributeSet::GetHeatAttribute());
	const float Cost = FVHBattleMath::EmberWallControlCost(Heat);

	// Pay first. No Control, or an unconfirmed step into Reckoning: no wall.
	if (!Price->PayPrice(Cost))
	{
		UE_LOG(LogVoidhammer, Log, TEXT("Ember Wall: price not paid (cost %.1f, control %.1f)."), Cost, Price->GetControl());
		EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
		return;
	}

	const float LengthCm = FVHBattleMath::EmberWallLengthMetres(Heat) * 100.f;
	const FVector Forward = Avatar->GetActorForwardVector().GetSafeNormal2D();
	const FVector Right = FVector::CrossProduct(FVector::UpVector, Forward);
	const FVector Centre = Avatar->GetActorLocation() + Forward * ForwardOffsetCm;
	const FRotator WallRotation = Right.Rotation();

	if (UWorld* World = Avatar->GetWorld())
	{
		if (WallActorClass)
		{
			FActorSpawnParameters Params;
			Params.Owner = Avatar;
			Params.Instigator = Cast<APawn>(Avatar);
			if (AActor* Wall = World->SpawnActor<AActor>(WallActorClass, Centre, WallRotation, Params))
			{
				Wall->SetLifeSpan(DurationSeconds);
				// The Blueprint reads length and burn from its owner's Heat, or from exposed vars set here in M5.
			}
		}
		else
		{
			DrawDebugLine(World, Centre - Right * LengthCm * 0.5f, Centre + Right * LengthCm * 0.5f,
				FColor(255, 120, 20), false, DurationSeconds, 0, 20.f);
		}
	}

	UE_LOG(LogVoidhammer, Log, TEXT("Ember Wall: %.1f m, %.1f burn/s, paid %.1f Control."),
		LengthCm / 100.f, FVHBattleMath::EmberWallBurnPerSecond(Heat), Cost);

	EndAbility(Handle, ActorInfo, ActivationInfo, true, false);
}
