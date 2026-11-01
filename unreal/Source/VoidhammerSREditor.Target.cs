// Voidhammer: The Shattered Realms. Editor target.
using UnrealBuildTool;
using System.Collections.Generic;

public class VoidhammerSREditorTarget : TargetRules
{
	public VoidhammerSREditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("VoidhammerSR");
	}
}
