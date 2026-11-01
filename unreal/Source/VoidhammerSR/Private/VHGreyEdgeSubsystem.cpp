// Voidhammer: The Shattered Realms. Grey edges.
#include "VHGreyEdgeSubsystem.h"

void UVHGreyEdgeSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	ResetCells(40, 1);
}

void UVHGreyEdgeSubsystem::ResetCells(int32 NumCells, int32 Seed)
{
	Grey.Init(0.f, FMath::Max(1, NumCells));
	KeptCoalDaysLeft.Init(0, Grey.Num());
	Random.Initialize(Seed);
}

float UVHGreyEdgeSubsystem::GetGrey(int32 Cell) const
{
	return Grey.IsValidIndex(Cell) ? Grey[Cell] : 0.f;
}

int32 UVHGreyEdgeSubsystem::CountAboveFaint() const
{
	int32 N = 0;
	for (float G : Grey) { if (G >= FaintThreshold) ++N; }
	return N;
}

void UVHGreyEdgeSubsystem::AddGreyCapped(int32 Cell, float Amount)
{
	if (!Grey.IsValidIndex(Cell) || Amount <= 0.f)
	{
		return;
	}
	float NewValue = FMath::Min(CapPerCell, Grey[Cell] + Amount);
	// Rare and faint: no new cell may cross the faint line if the limit is reached.
	if (Grey[Cell] < FaintThreshold && NewValue >= FaintThreshold && CountAboveFaint() >= MaxCellsAboveFaint)
	{
		NewValue = FMath::Min(NewValue, FaintThreshold - 0.01f);
	}
	Grey[Cell] = NewValue;
}

void UVHGreyEdgeSubsystem::SeedEdge(int32 Cell, float Amount)
{
	AddGreyCapped(Cell, Amount);
}

void UVHGreyEdgeSubsystem::AddFearEvent(int32 Cell, int32 Deaths)
{
	if (Deaths > FearDeathsThreshold)
	{
		AddGreyCapped(Cell, FearGreyGain);
	}
}

void UVHGreyEdgeSubsystem::LightKeptCoal(int32 Cell, int32 Days)
{
	if (KeptCoalDaysLeft.IsValidIndex(Cell))
	{
		KeptCoalDaysLeft[Cell] = FMath::Max(KeptCoalDaysLeft[Cell], Days);
	}
}

void UVHGreyEdgeSubsystem::AdvanceDay()
{
	// Slice map cells are a simple ring for now (M3 swaps in the real adjacency from the map data).
	const TArray<float> Before = Grey;
	const int32 N = Grey.Num();
	for (int32 i = 0; i < N; ++i)
	{
		if (KeptCoalDaysLeft[i] > 0)
		{
			--KeptCoalDaysLeft[i];
			Grey[i] = FMath::Max(0.f, Grey[i] - KeptCoalDecayPerDay);
			continue;
		}
		const bool bNeighbourGrey = Before[(i + N - 1) % N] >= FaintThreshold || Before[(i + 1) % N] >= FaintThreshold;
		if (bNeighbourGrey && Random.FRand() < SpreadChance)
		{
			AddGreyCapped(i, SpreadPerDay);
		}
	}
}
