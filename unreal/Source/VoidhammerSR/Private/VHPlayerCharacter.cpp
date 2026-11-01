// Voidhammer: The Shattered Realms. Third-person player character.
#include "VHPlayerCharacter.h"
#include "VoidhammerSR.h"
#include "VHBattleManager.h"
#include "VHGA_EmberWall.h"
#include "VHMagicCostAttributeSet.h"
#include "VHMagicCostComponent.h"

#include "AbilitySystemComponent.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/StaticMeshComponent.h"
#include "EngineUtils.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "InputAction.h"
#include "InputMappingContext.h"
#include "InputModifiers.h"
#include "Engine/LocalPlayer.h"
#include "Engine/StaticMesh.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"
#include "UObject/ConstructorHelpers.h"

AVHPlayerCharacter::AVHPlayerCharacter()
{
	PrimaryActorTick.bCanEverTick = false;

	GetCapsuleComponent()->InitCapsuleSize(42.f, 96.f);

	bUseControllerRotationPitch = false;
	bUseControllerRotationYaw = false;
	bUseControllerRotationRoll = false;

	UCharacterMovementComponent* MoveComp = GetCharacterMovement();
	MoveComp->bOrientRotationToMovement = true;
	MoveComp->RotationRate = FRotator(0.f, 540.f, 0.f);
	MoveComp->MaxWalkSpeed = WalkSpeed;
	MoveComp->JumpZVelocity = 420.f;
	MoveComp->AirControl = 0.25f;

	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(RootComponent);
	CameraBoom->TargetArmLength = 380.f;
	CameraBoom->SocketOffset = FVector(0.f, 55.f, 60.f); // over the right shoulder
	CameraBoom->bUsePawnControlRotation = true;
	CameraBoom->bEnableCameraLag = true;
	CameraBoom->CameraLagSpeed = 12.f;

	FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
	FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
	FollowCamera->bUsePawnControlRotation = false;

	PlaceholderBody = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("PlaceholderBody"));
	PlaceholderBody->SetupAttachment(RootComponent);
	PlaceholderBody->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	PlaceholderBody->SetRelativeScale3D(FVector(0.8f, 0.8f, 1.9f));
	PlaceholderBody->SetRelativeLocation(FVector::ZeroVector); // engine cylinder pivot is its centre
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	if (Cylinder.Succeeded())
	{
		PlaceholderBody->SetStaticMesh(Cylinder.Object);
	}

	AbilitySystem = CreateDefaultSubobject<UAbilitySystemComponent>(TEXT("AbilitySystem"));
	Attributes = CreateDefaultSubobject<UVHMagicCostAttributeSet>(TEXT("Attributes"));
	MagicCost = CreateDefaultSubobject<UVHMagicCostComponent>(TEXT("MagicCost"));

	StartingAbilities.Add(UVHGA_EmberWall::StaticClass());
}

void AVHPlayerCharacter::BeginPlay()
{
	Super::BeginPlay();

	AbilitySystem->InitAbilityActorInfo(this, this);
	for (const TSubclassOf<UGameplayAbility>& AbilityClass : StartingAbilities)
	{
		if (AbilityClass)
		{
			AbilitySystem->GiveAbility(FGameplayAbilitySpec(AbilityClass, 1));
		}
	}
	UE_LOG(LogVoidhammer, Log, TEXT("Voidhammer slice v0: player ready. Q casts Ember Wall; ` then VHTestBattle runs a test battle."));
}

void AVHPlayerCharacter::NotifyControllerChanged()
{
	Super::NotifyControllerChanged();

	BuildRuntimeInputIfMissing();
	if (APlayerController* PC = Cast<APlayerController>(Controller))
	{
		if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
			ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
		{
			Subsystem->AddMappingContext(DefaultMappingContext, 0);
		}
	}
}

// Builds IA_* and IMC_Default in memory if no assets were assigned, so the first
// Play works with zero setup. Replace with real assets for remapping (GDD 10.2).
void AVHPlayerCharacter::BuildRuntimeInputIfMissing()
{
	if (DefaultMappingContext)
	{
		return;
	}

	auto MakeAction = [this](const TCHAR* Name, EInputActionValueType Type) -> UInputAction*
	{
		UInputAction* Action = NewObject<UInputAction>(this, Name);
		Action->ValueType = Type;
		return Action;
	};

	if (!MoveAction)        MoveAction        = MakeAction(TEXT("IA_Move"), EInputActionValueType::Axis2D);
	if (!LookAction)        LookAction        = MakeAction(TEXT("IA_Look"), EInputActionValueType::Axis2D);
	if (!JumpAction)        JumpAction        = MakeAction(TEXT("IA_Jump"), EInputActionValueType::Boolean);
	if (!SprintAction)      SprintAction      = MakeAction(TEXT("IA_Sprint"), EInputActionValueType::Boolean);
	if (!AttackAction)      AttackAction      = MakeAction(TEXT("IA_Attack"), EInputActionValueType::Boolean);
	if (!BlockAction)       BlockAction       = MakeAction(TEXT("IA_Block"), EInputActionValueType::Boolean);
	if (!InteractAction)    InteractAction    = MakeAction(TEXT("IA_Interact"), EInputActionValueType::Boolean);
	if (!CastAction)        CastAction        = MakeAction(TEXT("IA_CastSpell"), EInputActionValueType::Boolean);
	if (!OrderChargeAction) OrderChargeAction = MakeAction(TEXT("IA_OrderCharge"), EInputActionValueType::Boolean);
	if (!OrderHoldAction)   OrderHoldAction   = MakeAction(TEXT("IA_OrderHold"), EInputActionValueType::Boolean);

	UInputMappingContext* Ctx = NewObject<UInputMappingContext>(this, TEXT("IMC_Default_Runtime"));

	auto Swizzle = [this]() { return NewObject<UInputModifierSwizzleAxis>(this); }; // X -> Y
	auto Negate = [this](bool bX, bool bY)
	{
		UInputModifierNegate* N = NewObject<UInputModifierNegate>(this);
		N->bX = bX; N->bY = bY; N->bZ = false;
		return N;
	};

	// Move: WASD + left stick
	Ctx->MapKey(MoveAction, EKeys::W).Modifiers.Add(Swizzle());
	{
		FEnhancedActionKeyMapping& S = Ctx->MapKey(MoveAction, EKeys::S);
		S.Modifiers.Add(Swizzle());
		S.Modifiers.Add(Negate(true, true));
	}
	Ctx->MapKey(MoveAction, EKeys::A).Modifiers.Add(Negate(true, true));
	Ctx->MapKey(MoveAction, EKeys::D);
	Ctx->MapKey(MoveAction, EKeys::Gamepad_Left2D);

	// Look: mouse + right stick (pitch inverted to feel natural)
	Ctx->MapKey(LookAction, EKeys::Mouse2D).Modifiers.Add(Negate(false, true));
	Ctx->MapKey(LookAction, EKeys::Gamepad_Right2D).Modifiers.Add(Negate(false, true));

	Ctx->MapKey(JumpAction, EKeys::SpaceBar);
	Ctx->MapKey(JumpAction, EKeys::Gamepad_FaceButton_Bottom);
	Ctx->MapKey(SprintAction, EKeys::LeftShift);
	Ctx->MapKey(SprintAction, EKeys::Gamepad_LeftThumbstick);
	Ctx->MapKey(AttackAction, EKeys::LeftMouseButton);
	Ctx->MapKey(AttackAction, EKeys::Gamepad_RightTrigger);
	Ctx->MapKey(BlockAction, EKeys::RightMouseButton);
	Ctx->MapKey(BlockAction, EKeys::Gamepad_LeftTrigger);
	Ctx->MapKey(InteractAction, EKeys::E);
	Ctx->MapKey(InteractAction, EKeys::Gamepad_FaceButton_Left);
	Ctx->MapKey(CastAction, EKeys::Q);
	Ctx->MapKey(CastAction, EKeys::Gamepad_RightShoulder);
	Ctx->MapKey(OrderChargeAction, EKeys::C);
	Ctx->MapKey(OrderChargeAction, EKeys::Gamepad_DPad_Up);
	Ctx->MapKey(OrderHoldAction, EKeys::H);
	Ctx->MapKey(OrderHoldAction, EKeys::Gamepad_DPad_Down);

	DefaultMappingContext = Ctx;
}

void AVHPlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
	BuildRuntimeInputIfMissing();

	UEnhancedInputComponent* EIC = Cast<UEnhancedInputComponent>(PlayerInputComponent);
	if (!EIC)
	{
		UE_LOG(LogVoidhammer, Error, TEXT("Enhanced Input is not the default input component. Check Config/DefaultInput.ini."));
		return;
	}

	EIC->BindAction(MoveAction, ETriggerEvent::Triggered, this, &AVHPlayerCharacter::Move);
	EIC->BindAction(LookAction, ETriggerEvent::Triggered, this, &AVHPlayerCharacter::Look);
	EIC->BindAction(JumpAction, ETriggerEvent::Started, this, &ACharacter::Jump);
	EIC->BindAction(JumpAction, ETriggerEvent::Completed, this, &ACharacter::StopJumping);
	EIC->BindAction(SprintAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::SprintStart);
	EIC->BindAction(SprintAction, ETriggerEvent::Completed, this, &AVHPlayerCharacter::SprintStop);
	EIC->BindAction(AttackAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::AttackStart);
	EIC->BindAction(AttackAction, ETriggerEvent::Completed, this, &AVHPlayerCharacter::AttackRelease);
	EIC->BindAction(BlockAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::BlockStart);
	EIC->BindAction(BlockAction, ETriggerEvent::Completed, this, &AVHPlayerCharacter::BlockStop);
	EIC->BindAction(InteractAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::Interact);
	EIC->BindAction(CastAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::CastSpell);
	EIC->BindAction(OrderChargeAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::OrderCharge);
	EIC->BindAction(OrderHoldAction, ETriggerEvent::Started, this, &AVHPlayerCharacter::OrderHold);
}

void AVHPlayerCharacter::Move(const FInputActionValue& Value)
{
	const FVector2D Axis = Value.Get<FVector2D>();
	if (!Controller)
	{
		return;
	}
	const FRotator Yaw(0.f, Controller->GetControlRotation().Yaw, 0.f);
	AddMovementInput(FRotationMatrix(Yaw).GetUnitAxis(EAxis::X), Axis.Y);
	AddMovementInput(FRotationMatrix(Yaw).GetUnitAxis(EAxis::Y), Axis.X);
}

void AVHPlayerCharacter::Look(const FInputActionValue& Value)
{
	const FVector2D Axis = Value.Get<FVector2D>();
	AddControllerYawInput(Axis.X);
	AddControllerPitchInput(Axis.Y);
}

void AVHPlayerCharacter::SprintStart() { GetCharacterMovement()->MaxWalkSpeed = SprintSpeed; }
void AVHPlayerCharacter::SprintStop()  { GetCharacterMovement()->MaxWalkSpeed = WalkSpeed; }

void AVHPlayerCharacter::AttackStart()
{
	AttackPressedTime = FPlatformTime::Seconds();
}

void AVHPlayerCharacter::AttackRelease()
{
	const bool bHeavy = (FPlatformTime::Seconds() - AttackPressedTime) >= HeavyHoldSeconds;
	// M1: replace with montage + hit cone (70 deg, 2.2 m, up to 3 targets) + stamina cost.
	UE_LOG(LogVoidhammer, Log, TEXT("%s attack (stub)."), bHeavy ? TEXT("Heavy") : TEXT("Light"));
	AddHeat(2.f);
}

void AVHPlayerCharacter::BlockStart() { bBlocking = true; }
void AVHPlayerCharacter::BlockStop()  { bBlocking = false; }

void AVHPlayerCharacter::Interact()
{
	// M2: trace for a UVHInteractable (shop, tavern, hall, NPC) and open its sheet or dialogue.
	UE_LOG(LogVoidhammer, Log, TEXT("Interact (stub)."));
}

void AVHPlayerCharacter::CastSpell()
{
	AbilitySystem->TryActivateAbilityByClass(UVHGA_EmberWall::StaticClass());
}

AVHBattleManager* AVHPlayerCharacter::FindBattleManager() const
{
	for (TActorIterator<AVHBattleManager> It(GetWorld()); It; ++It)
	{
		return *It;
	}
	return nullptr;
}

void AVHPlayerCharacter::OrderCharge()
{
	if (AVHBattleManager* BM = FindBattleManager()) BM->IssueOrder(EVHOrder::Charge);
}

void AVHPlayerCharacter::OrderHold()
{
	if (AVHBattleManager* BM = FindBattleManager()) BM->IssueOrder(EVHOrder::Hold);
}

void AVHPlayerCharacter::AddHeat(float Amount)
{
	AbilitySystem->ApplyModToAttribute(UVHMagicCostAttributeSet::GetHeatAttribute(), EGameplayModOp::Additive, Amount);
}

// ---- Console commands ----
void AVHPlayerCharacter::VHTestBattle(int32 PlayerTroops, int32 EnemyTroops)
{
	AVHBattleManager* BM = FindBattleManager();
	if (!BM)
	{
		BM = GetWorld()->SpawnActor<AVHBattleManager>(GetActorLocation(), FRotator::ZeroRotator);
	}
	if (BM)
	{
		BM->StartBattle(PlayerTroops, EnemyTroops);
	}
}

void AVHPlayerCharacter::VHVow(int32 bLetHimRide)
{
	if (AVHBattleManager* BM = FindBattleManager()) BM->ResolveKaelrenVow(bLetHimRide != 0);
}

void AVHPlayerCharacter::VHHeat(float NewHeat)
{
	const float Current = AbilitySystem->GetNumericAttribute(UVHMagicCostAttributeSet::GetHeatAttribute());
	AddHeat(NewHeat - Current);
}

void AVHPlayerCharacter::VHRest()
{
	MagicCost->RestOneNight();
	UE_LOG(LogVoidhammer, Log, TEXT("Rested. Control %.1f / ceiling %.1f."), MagicCost->GetControl(), MagicCost->GetControlCeiling());
}

void AVHPlayerCharacter::VHConfirmReckoning()
{
	MagicCost->bReckoningConfirmed = true;
}
