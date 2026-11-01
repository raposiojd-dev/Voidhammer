# Voidhammer: The Shattered Realms (Unreal Engine 5.8)

This is the **vertical slice** project: Flameborne, the city of Hearthmount, one big field battle, Kaelren and Jorren, one spell that costs you something, and grey edges on the map.

- **Design:** [`design/VERTICAL_SLICE_GDD_v1.md`](design/VERTICAL_SLICE_GDD_v1.md)
- **Code:** `Source/VoidhammerSR/` (C++)
- **Settings:** `Config/` (it starts in **low-spec mode** for a modest graphics card)
- **AI studio:** `.claude/`. These are adapted agents and skills from Claude Code Game Studios (MIT). See `.claude/ATTRIBUTION.md`.

The folder holds **text only** so far: no maps or art. On the first open, Unreal builds the code and you get a small test map with a placeholder character (a grey cylinder) you can walk around.

---

## Open it on your computer (Windows, step by step)

Allow about **2 hours** the first time. Most of that is downloads and Unreal compiling shaders, and you don't have to watch it.

### Step 0. Check your PC (5 minutes)
Press **Start**, type **dxdiag**, and press Enter. Note:
- **System tab:** Processor and Memory (RAM)
- **Display tab:** the graphics card's name and "Display Memory" (VRAM)

Send those to the studio. You can carry on meanwhile: the project is already set to **low-spec mode**, so a weaker graphics card is fine for the early milestones. See *If your graphics card is weak* below.

You need about **150 GB of free space on an SSD**: Unreal ~60–100 GB, Visual Studio ~20 GB, plus the project and its cache.

### Step 1. Install the tools (about 60–90 minutes, mostly waiting)
1. **Epic Games Launcher.** Download it from epicgames.com, sign in, and open **Unreal Engine → Library**. Click **+** next to *Engine Versions* and choose **5.8**, then **Install**. In *Options*, you can untick target platforms you don't need (Android, iOS, Linux) to save space.
2. **Visual Studio.** Install **Visual Studio 2026 Community** (or 2022 Community), which is free. In the installer, tick the **"Game development with C++"** workload. On the right-hand side, make sure these are ticked: **Unreal Engine installer**, **a Windows 10/11 SDK**, and **MSVC build tools (latest)**. Unreal compiles our C++ with this. *(Epic's "Setting up Visual Studio" page for 5.8 lists the exact components if anything is unclear.)*
3. **Git and Git LFS.** The easy option is **GitHub Desktop** (desktop.github.com), which includes LFS. Or install **Git for Windows** (git-scm.com), then open *Git Bash* and run `git lfs install` once.

### Step 2. Get the project (10 minutes)
**With GitHub Desktop:** File → Clone repository → `raposiojd-dev/Voidhammer` → choose a short folder such as `C:\Dev\Voidhammer`. Then **Current branch → `unreal/slice-v0`**.

**With Git Bash:**
```bash
cd /c/Dev
git clone https://github.com/raposiojd-dev/Voidhammer.git
cd Voidhammer
git checkout unreal/slice-v0
```
Keep the path short (for example `C:\Dev\...`). Windows has path-length limits, and Unreal's deep folders can hit them.

### Step 3. First build (15–40 minutes)
1. Open the folder `Voidhammer\unreal\`.
2. **Right-click `VoidhammerSR.uproject` → "Generate Visual Studio project files".** If that option is missing (Windows 11 hides it): click *Show more options* first. Or open the Epic Launcher once, which registers the file type.
3. **Double-click `VoidhammerSR.uproject`.** Unreal asks: *"The following modules are missing or built with a different engine version... Would you like to rebuild them now?"* Click **Yes**. It compiles the C++ (a few minutes).
4. The editor opens and compiles shaders (the bottom-right counter). The first time this can take 10–30 minutes; let it finish.

**If the rebuild fails:** open `VoidhammerSR.sln` (made in step 3.2) in Visual Studio, set the configuration to **Development Editor** / **Win64**, and press **Build → Build Solution**. Copy the **first** red error from the *Error List* and send it to Claude Code. Most first-build errors are a missing Visual Studio component or a small API change in 5.8, and are quick to fix.

### Step 4. Set the editor to low settings (2 minutes, once)
In the editor's top-right corner (or the main toolbar): **Settings → Engine Scalability Settings → Low.**
Also:
- **Edit → Editor Preferences → General → Performance:** tick **"Use Less CPU when in Background"**.
- In the viewport's top-left menu (☰ / the arrow): untick **Realtime** when you're not playing, and set **Screen Percentage** to **50%** if it feels slow.

### Step 5. Press Play (M0 is done when this works)
Click **Play** (the green ▶ at the top). Then:
- **WASD** to move, **mouse** to look, **Shift** to run, **Space** to jump. A gamepad works too (left stick, right stick, A).
- **Q** casts **Ember Wall**: an orange debug line appears in front of you. Press the **`** (backtick) key to open the console. Type `VHHeat 80` and press Q again: the wall is longer, and it costs more.
- Cast several times: the **Output Log** (Window → Output Log, filter "LogVoidhammer") shows **Control** dropping into **Debt**. Type `VHRest` to rest one night.
- Console `VHTestBattle 120 160` runs a numbers-only battle in the log. When Kaelren asks to ride, type `VHVow 1` (let him ride) or `VHVow 0` (pin him).
- **Esc** stops play.

**Run the tests:** Tools → **Session Frontend** → *Automation* tab → filter **Voidhammer** → tick them all → **Start Tests**. All should be green.

---

## If your graphics card is weak

The project ships in **low-spec mode**: no Lumen, no virtual shadow maps, screen-space reflections, Low scalability, and a small startup map. Details are in GDD §10.10a.

- **The editor crashes on start, or reports "DX12 / SM6 not supported":** right-click `VoidhammerSR.uproject` → *Create shortcut*. Edit the shortcut's **Target** to add ` -dx11` after the closing quote, then launch through that shortcut.
- **Still under ~20 fps in an empty map:** tell the studio. The next step is forward shading (one line in `Config/DefaultEngine.ini`; read the comment there first, because it triggers a full shader recompile).
- **Heavy jobs** (lighting bakes, the big battle tests, the art pass, MetaHuman) can run on a **cloud GPU workstation** rented by the hour: Shadow, Vagon, Paperspace, or an AWS or Azure GPU machine in Sydney. The project is in Git, so you clone it there, work, push, and shut the machine down. The Treasurer checks prices first. See GDD §10.10b.
- **Upgrade, when you're ready:** a graphics card with **8 GB VRAM or more** (12–16 GB is better) and **32 GB of RAM**, per Epic's recommended spec. Send the dxdiag details first, so the studio can check your power supply and case. See GDD §10.10c.
- **Full look later:** at milestone M7, or on a strong or cloud GPU, switch `Config/DefaultEngine.ini` to the *FULL LOOK* block (Lumen and virtual shadows).

---

## Daily routine
1. **Pull** (GitHub Desktop: *Fetch origin → Pull*) before you open Unreal.
2. Work. **Close Unreal before committing** maps or assets.
3. **Commit** with a clear message, then **Push**. Never push to `main` from this project: slice work goes on `unreal/...` branches.
4. Binary files (`.uasset`, `.umap`, art, audio) go through **Git LFS** automatically (see `.gitattributes`). They're **lockable**: if you ever work with someone else, lock a map before editing it.

**Storage warning:** GitHub's free LFS allowance is **10 GiB of storage and 10 GiB of downloads a month**. Unreal art fills that fast. Before the first large art drop (around milestone M2–M3), the studio will propose either a separate repo for the Unreal project or Perforce (GDD §10.8).

---

## Folder map
```
unreal/
├── VoidhammerSR.uproject      the project file (double-click to open)
├── Config/                    engine, game, input, default graphics settings (low-spec)
├── Source/
│   ├── VoidhammerSR.Target.cs / VoidhammerSREditor.Target.cs
│   └── VoidhammerSR/
│       ├── VoidhammerSR.Build.cs     module dependencies (GAS, Enhanced Input)
│       ├── Public/  Private/         game code (see below)
│       └── Private/Tests/            automation tests
├── design/VERTICAL_SLICE_GDD_v1.md
└── .claude/                   Voidhammer-adapted studio agents and skills
```

| Class | What it is |
|---|---|
| `AVHGameMode` | Default game mode; spawns the player |
| `AVHPlayerCharacter` | Third-person character, camera, Enhanced Input (KB/M + gamepad, built at runtime), GAS, console commands |
| `UVHMagicCostAttributeSet` | GAS attributes: Health, Stamina, **Control**, **ControlCeiling**, **Heat**, **Faded** |
| `UVHMagicCostComponent` | The price: Toll/Debt/Arrears/Reckoning stages, permanent ceiling loss, surges, `CanRefuseSelf()` for dialogue |
| `UVHGA_EmberWall` | The Embercraft spell (GAS ability): stronger when hot, paid in Control |
| `AVHBattleManager` | Battle referee: morale, rout, break rules, Kaelren's vow (numbers-only until M4) |
| `UVHGreyEdgeSubsystem` | Grey edges on the map: rare, faint, capped, no rifts |
| `FVHBattleMath` | Every formula in one testable place |

## Working with Claude Code here
Start Claude Code **inside this `unreal/` folder** so it loads `unreal/CLAUDE.md`, the Voidhammer rules and the adapted agents and skills. Try: *"use the ue-gas-specialist to move Ember Wall's cost to a GameplayEffect with SetByCaller"*, or `/balance-check`, `/scope-check`, `/sprint-plan`.

## Mac (footnote)
John is on Windows. For the record: on a Mac, install **Xcode** (the version Epic lists for 5.8), then open the `.uproject` from the Epic Launcher. The Launcher offers to build it. PS5 work later needs Windows.
