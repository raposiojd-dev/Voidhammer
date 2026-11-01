// Voidhammer: The Shattered Realms. Unit tests for the pure formulas (GDD section 5).
// Run: Tools > Session Frontend > Automation, filter "Voidhammer", or headless:
//   UnrealEditor-Cmd.exe <path>/VoidhammerSR.uproject -ExecCmds="Automation RunTests Voidhammer;Quit" -unattended -nullrhi
#include "Misc/AutomationTest.h"
#include "VHBattleMath.h"

#if WITH_DEV_AUTOMATION_TESTS

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FVHMitigationTest, "Voidhammer.Combat.ArmourAndBlock",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::ProductFilter)
bool FVHMitigationTest::RunTest(const FString& Parameters)
{
	TestEqual(TEXT("No armour: full damage"), FVHBattleMath::MitigateDamage(18.f, 0.f), 18.f);
	TestEqual(TEXT("Armour 100 halves damage"), FVHBattleMath::MitigateDamage(20.f, 100.f), 10.f);
	TestEqual(TEXT("Negative armour treated as 0"), FVHBattleMath::MitigateDamage(10.f, -50.f), 10.f);
	TestEqual(TEXT("Block -80%"), FVHBattleMath::ApplyBlock(10.f, true, false), 2.f, 0.001f);
	TestEqual(TEXT("Perfect block: 0"), FVHBattleMath::ApplyBlock(34.f, true, true), 0.f);
	TestEqual(TEXT("No block"), FVHBattleMath::ApplyBlock(34.f, false, false), 34.f);
	return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FVHMoraleTest, "Voidhammer.Battle.MoraleAndBreak",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::ProductFilter)
bool FVHMoraleTest::RunTest(const FString& Parameters)
{
	TestEqual(TEXT("T1 with commander"), FVHBattleMath::StartingMorale(true, 1.f), 80.f);
	TestEqual(TEXT("T3 without commander"), FVHBattleMath::StartingMorale(false, 3.f), 80.f);
	TestEqual(TEXT("Clamped at 100"), FVHBattleMath::StartingMorale(true, 9.f), 100.f);

	FVHBattleSide Side;
	Side.StartStrength = 150;
	Side.Current = 60.f;
	TestFalse(TEXT("40% strength holds"), FVHBattleMath::HasSideBroken(Side));
	Side.Current = 49.f;
	TestTrue(TEXT("Under a third breaks"), FVHBattleMath::HasSideBroken(Side));
	Side.Current = 150.f;
	Side.RoutingFraction = 0.6f;
	TestTrue(TEXT("60% routing breaks"), FVHBattleMath::HasSideBroken(Side));
	return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FVHPriceTest, "Voidhammer.Magic.PriceStagesAndEmberWall",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::ProductFilter)
bool FVHPriceTest::RunTest(const FString& Parameters)
{
	const FVHPriceThresholds T;
	TestTrue(TEXT("100 = Toll"), FVHBattleMath::StageForControl(100.f, T) == EVHPriceStage::Toll);
	TestTrue(TEXT("70 = Toll (boundary)"), FVHBattleMath::StageForControl(70.f, T) == EVHPriceStage::Toll);
	TestTrue(TEXT("69.9 = Debt"), FVHBattleMath::StageForControl(69.9f, T) == EVHPriceStage::Debt);
	TestTrue(TEXT("39 = Arrears"), FVHBattleMath::StageForControl(39.f, T) == EVHPriceStage::Arrears);
	TestTrue(TEXT("14 = Reckoning"), FVHBattleMath::StageForControl(14.f, T) == EVHPriceStage::Reckoning);

	TestEqual(TEXT("Calm wall: 8 m"), FVHBattleMath::EmberWallLengthMetres(0.f), 8.f);
	TestEqual(TEXT("Hot wall: 16 m"), FVHBattleMath::EmberWallLengthMetres(100.f), 16.f, 0.001f);
	TestEqual(TEXT("Calm burn: 15/s"), FVHBattleMath::EmberWallBurnPerSecond(0.f), 15.f, 0.001f);
	TestEqual(TEXT("Hot burn: 25/s"), FVHBattleMath::EmberWallBurnPerSecond(100.f), 25.f, 0.001f);
	TestEqual(TEXT("Calm cost: 12"), FVHBattleMath::EmberWallControlCost(0.f), 12.f);
	TestEqual(TEXT("Hot cost: 22"), FVHBattleMath::EmberWallControlCost(100.f), 22.f, 0.001f);
	TestEqual(TEXT("Heat clamps"), FVHBattleMath::EmberWallControlCost(500.f), 22.f, 0.001f);

	// From full Control, a calm caster reaches Debt on the 3rd cast (100 -> 88 -> 76 -> 64).
	float Control = 100.f;
	int32 Casts = 0;
	while (FVHBattleMath::StageForControl(Control, T) == EVHPriceStage::Toll) { Control -= FVHBattleMath::EmberWallControlCost(0.f); ++Casts; }
	TestEqual(TEXT("Debt on cast 3 when calm"), Casts, 3);

	TestEqual(TEXT("Party cap L1"), FVHBattleMath::PartySizeCap(1, false), 40);
	TestEqual(TEXT("Party cap L9 + Kaelren"), FVHBattleMath::PartySizeCap(9, true), 130);
	return true;
}

#endif // WITH_DEV_AUTOMATION_TESTS
