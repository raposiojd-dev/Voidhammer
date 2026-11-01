// Voidhammer: The Shattered Realms. Main game module build rules.
using UnrealBuildTool;

public class VoidhammerSR : ModuleRules
{
	public VoidhammerSR(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"EnhancedInput",
			"GameplayAbilities",
			"GameplayTags",
			"GameplayTasks"
		});

		PrivateDependencyModuleNames.AddRange(new string[] { });

		// Later milestones (see design/VERTICAL_SLICE_GDD_v1.md section 10):
		// "UMG", "Slate", "SlateCore"    - HUD and menus (M5)
		// "AIModule", "StateTreeModule"  - soldier AI (M4)
		// "AnimToTexture" plugin          - crowd instancing (M4)
		// "MassEntity", "MassCommon"      - only if the M4 Mass spike passes
	}
}
