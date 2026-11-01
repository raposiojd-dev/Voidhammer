// Voidhammer: The Shattered Realms. Game target.
using UnrealBuildTool;
using System.Collections.Generic;

public class VoidhammerSRTarget : TargetRules
{
	public VoidhammerSRTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("VoidhammerSR");
	}
}
