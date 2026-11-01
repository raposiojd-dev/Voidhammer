// Voidhammer: The Shattered Realms. Third-person player character (city and battle).
// Controls: GDD section 4. Works with no input assets: if the IA_/IMC_ properties
// are empty, a default keyboard+mouse and gamepad mapping is built at runtime.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "AbilitySystemInterface.h"
#include "InputActionValue.h"
#include "VHPlayerCharacter.generated.h"

class UAbilitySystemComponent;
class UCameraComponent;
class UInputAction;
class UInputMappingContext;
class USpringArmComponent;
class UStaticMeshComponent;
class UVHMagicCostAttributeSet;
class UVHMagicCostComponent;
class UGameplayAbility;

UCLASS()
class VOIDHAMMERSR_API AVHPlayerCharacter : public ACharacter, public IAbilitySystemInterface
{
	GENERATED_BODY()

public:
	AVHPlayerCharacter();

	virtual UAbilitySystemComponent* GetAbilitySystemComponent() const override { return AbilitySystem; }

	UFUNCTION(BlueprintPure, Category = "Voidhammer") UVHMagicCostComponent* GetMagicCost() const { return MagicCost; }

	// ---- Console commands (press ` in Play, type the name) ----
	/** Start a numbers-only test battle: VHTestBattle 120 160 */
	UFUNCTION(Exec) void VHTestBattle(int32 PlayerTroops = 120, int32 EnemyTroops = 160);
	/** Answer Kaelren's vow in a running test battle: VHVow 1 = let him ride, 0 = pin him */
	UFUNCTION(Exec) void VHVow(int32 bLetHimRide = 1);
	/** Set Heat for testing the spell: VHHeat 80 */
	UFUNCTION(Exec) void VHHeat(float NewHeat = 80.f);
	/** Rest one night (restores Control per the price rules) */
	UFUNCTION(Exec) void VHRest();
	/** Confirm the next cast may cross into Reckoning */
	UFUNCTION(Exec) void VHConfirmReckoning();

protected:
	virtual void BeginPlay() override;
	virtual void NotifyControllerChanged() override;
	virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

	// ---- Components ----
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera") TObjectPtr<USpringArmComponent> CameraBoom;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera") TObjectPtr<UCameraComponent> FollowCamera;
	/** Greybox body (engine cylinder) until the Mannequin/soldier mesh goes in at M1. */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Greybox") TObjectPtr<UStaticMeshComponent> PlaceholderBody;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Abilities") TObjectPtr<UAbilitySystemComponent> AbilitySystem;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Abilities") TObjectPtr<UVHMagicCostAttributeSet> Attributes;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Abilities") TObjectPtr<UVHMagicCostComponent> MagicCost;

	/** Abilities granted at start. Defaults to Ember Wall. */
	UPROPERTY(EditDefaultsOnly, Category = "Abilities") TArray<TSubclassOf<UGameplayAbility>> StartingAbilities;

	// ---- Input (optional assets; runtime defaults are built if empty) ----
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputMappingContext> DefaultMappingContext;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> MoveAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> LookAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> JumpAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> SprintAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> AttackAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> BlockAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> InteractAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> CastAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> OrderChargeAction;
	UPROPERTY(EditDefaultsOnly, Category = "Input") TObjectPtr<UInputAction> OrderHoldAction;

	// ---- Movement tuning (cm/s) ----
	UPROPERTY(EditDefaultsOnly, Category = "Movement") float WalkSpeed = 350.f;
	UPROPERTY(EditDefaultsOnly, Category = "Movement") float SprintSpeed = 600.f;
	/** Hold attack at least this long for a heavy attack (GDD 5.1). */
	UPROPERTY(EditDefaultsOnly, Category = "Combat") float HeavyHoldSeconds = 0.4f;

private:
	void BuildRuntimeInputIfMissing();

	void Move(const FInputActionValue& Value);
	void Look(const FInputActionValue& Value);
	void SprintStart();
	void SprintStop();
	void AttackStart();
	void AttackRelease();
	void BlockStart();
	void BlockStop();
	void Interact();
	void CastSpell();
	void OrderCharge();
	void OrderHold();

	class AVHBattleManager* FindBattleManager() const;
	void AddHeat(float Amount);

	double AttackPressedTime = 0.0;
	bool bBlocking = false;
};
