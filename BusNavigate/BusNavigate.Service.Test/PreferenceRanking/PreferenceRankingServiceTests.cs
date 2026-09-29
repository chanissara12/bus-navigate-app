using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;
using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Service.Test.PreferenceRanking;

public class PreferenceRankingServiceTests
{
    // Minimal test-only candidate shape — deliberately NOT TravelOption/RecoveryOption,
    // to prove RankAsync<T> is genuinely generic (03: shared by trip-planning and,
    // later, recovery) rather than secretly coupled to one concrete type.
    private record TestCandidate(
        string Name,
        double WalkingDistanceMeters,
        int TransferCount,
        int? BoardingStopId,
        int? AlightingStopId,
        IReadOnlyList<EvaluationReason> Reasons);

    private static (BusNavigateDbContext DbContext, Service.Implements.PreferenceRanking.PreferenceRankingService Service)
        CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.PreferenceRanking.PreferenceRankingService(dbContext));
    }

    private static UserPreferenceEntity Preference(
        bool minimizeWalking = false, bool minimizeTransfers = false, bool avoidStreetCrossing = false) => new()
        {
            UserId = 1,
            MinimizeWalking = minimizeWalking,
            MinimizeTransfers = minimizeTransfers,
            AvoidStreetCrossing = avoidStreetCrossing,
            UpdatedAt = DateTime.UtcNow,
        };

    private static Task<IReadOnlyList<TestCandidate>> RankAsync(
        Service.Implements.PreferenceRanking.PreferenceRankingService service,
        IReadOnlyList<TestCandidate> candidates, UserPreferenceEntity preference) =>
        service.RankAsync(
            candidates,
            preference,
            getWalkingDistanceMeters: c => c.WalkingDistanceMeters,
            getTransferCount: c => c.TransferCount,
            getBoardingStopId: c => c.BoardingStopId,
            getAlightingStopId: c => c.AlightingStopId,
            getReasons: c => c.Reasons,
            withReasons: (c, reasons) => c with { Reasons = reasons });

    [Fact]
    public async Task RankAsync_NoToggleOn_ReturnsExactSameOrder()
    {
        // Arrange
        var (_, service) = CreateSubject();
        var candidates = new List<TestCandidate>
        {
            new("C", 500, 0, null, null, []),
            new("A", 100, 0, null, null, []),
            new("B", 300, 0, null, null, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference());

        // Assert
        Assert.Equal(["C", "A", "B"], result.Select(c => c.Name));
    }

    [Fact]
    public async Task RankAsync_MinimizeWalkingOn_FavorsLowerWalkingDistanceAndTagsTheWinner()
    {
        // Arrange
        var (_, service) = CreateSubject();
        var candidates = new List<TestCandidate>
        {
            new("Far", 500, 0, null, null, []),
            new("Near", 100, 0, null, null, []),
            new("Mid", 300, 0, null, null, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(minimizeWalking: true));

        // Assert
        Assert.Equal(["Near", "Mid", "Far"], result.Select(c => c.Name));
        Assert.Contains(result[0].Reasons, r => r.Code == ReasonCode.MatchesMinimizeWalking);
        Assert.DoesNotContain(result[1].Reasons, r => r.Code == ReasonCode.MatchesMinimizeWalking);
    }

    [Fact]
    public async Task RankAsync_MinimizeTransfersOn_FavorsFewerTransfersAndTagsTheWinner()
    {
        // Arrange
        var (_, service) = CreateSubject();
        var candidates = new List<TestCandidate>
        {
            new("TwoTransfers", 100, 2, null, null, []),
            new("NoTransfers", 100, 0, null, null, []),
            new("OneTransfer", 100, 1, null, null, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(minimizeTransfers: true));

        // Assert
        Assert.Equal(["NoTransfers", "OneTransfer", "TwoTransfers"], result.Select(c => c.Name));
        Assert.Contains(result[0].Reasons, r => r.Code == ReasonCode.MatchesMinimizeTransfers);
    }

    [Fact]
    public async Task RankAsync_MinimizeTransfersOn_AllCandidatesTie_TagsNothing()
    {
        // Arrange — Phase 1 trip-planning has no transfer variance yet (03); the
        // toggle must not tag a "winner" when nothing actually discriminates.
        var (_, service) = CreateSubject();
        var candidates = new List<TestCandidate>
        {
            new("A", 100, 0, null, null, []),
            new("B", 200, 0, null, null, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(minimizeTransfers: true));

        // Assert
        Assert.All(result, c => Assert.DoesNotContain(c.Reasons, r => r.Code == ReasonCode.MatchesMinimizeTransfers));
    }

    [Fact]
    public async Task RankAsync_AvoidStreetCrossingOn_FavorsSkywalkOverAtGradeCrossing()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var skywalkStop = await SeedBusStopAsync(dbContext);
        var crossingStop = await SeedBusStopAsync(dbContext);
        dbContext.StopLandmarks.Add(new StopLandmark
        {
            BusStopId = skywalkStop,
            LandmarkType = LandmarkType.Skywalk,
            NameTh = "s",
            NameEn = "s",
            ExternalOsmId = "1",
            UpdatedAt = DateTime.UtcNow,
        });
        dbContext.StopLandmarks.Add(new StopLandmark
        {
            BusStopId = crossingStop,
            LandmarkType = LandmarkType.Crossing,
            NameTh = "c",
            NameEn = "c",
            ExternalOsmId = "2",
            UpdatedAt = DateTime.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var candidates = new List<TestCandidate>
        {
            new("AtGrade", 100, 0, crossingStop, crossingStop, []),
            new("Skywalk", 100, 0, skywalkStop, skywalkStop, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(avoidStreetCrossing: true));

        // Assert
        Assert.Equal(["Skywalk", "AtGrade"], result.Select(c => c.Name));
        Assert.Contains(result[0].Reasons, r => r.Code == ReasonCode.MatchesAvoidStreetCrossing);
        Assert.DoesNotContain(result[1].Reasons, r => r.Code == ReasonCode.MatchesAvoidStreetCrossing);
    }

    [Fact]
    public async Task RankAsync_AvoidStreetCrossingOn_NoNearbyLandmarkData_IsNeitherFavoredNorPenalized()
    {
        // Arrange — one candidate has a known at-grade crossing (unfavorable), the
        // other has no landmark data at all near its stops (neutral) — neutral must
        // rank ahead of the known-unfavorable one, not tie or lose to it.
        var (dbContext, service) = CreateSubject();
        var crossingStop = await SeedBusStopAsync(dbContext);
        var unknownStop = await SeedBusStopAsync(dbContext);
        dbContext.StopLandmarks.Add(new StopLandmark
        {
            BusStopId = crossingStop,
            LandmarkType = LandmarkType.Crossing,
            NameTh = "c",
            NameEn = "c",
            ExternalOsmId = "3",
            UpdatedAt = DateTime.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var candidates = new List<TestCandidate>
        {
            new("AtGrade", 100, 0, crossingStop, crossingStop, []),
            new("NoData", 100, 0, unknownStop, unknownStop, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(avoidStreetCrossing: true));

        // Assert
        Assert.Equal(["NoData", "AtGrade"], result.Select(c => c.Name));
        Assert.DoesNotContain(result[0].Reasons, r => r.Code == ReasonCode.MatchesAvoidStreetCrossing);
    }

    [Fact]
    public async Task RankAsync_AvoidStreetCrossingOn_WorstLegAcrossBoardingAndAlighting_Wins()
    {
        // Arrange — boarding stop has a skywalk (favorable) but the alighting stop only
        // has an at-grade crossing (unfavorable): the rider still has to cross it, so
        // the option as a whole must be treated as the worse (unfavorable) case.
        var (dbContext, service) = CreateSubject();
        var skywalkStop = await SeedBusStopAsync(dbContext);
        var crossingStop = await SeedBusStopAsync(dbContext);
        var bothSkywalkStopA = await SeedBusStopAsync(dbContext);
        var bothSkywalkStopB = await SeedBusStopAsync(dbContext);
        dbContext.StopLandmarks.AddRange(
            new StopLandmark
            {
                BusStopId = skywalkStop,
                LandmarkType = LandmarkType.Skywalk,
                NameTh = "s",
                NameEn = "s",
                ExternalOsmId = "4",
                UpdatedAt = DateTime.UtcNow,
            },
            new StopLandmark
            {
                BusStopId = crossingStop,
                LandmarkType = LandmarkType.Crossing,
                NameTh = "c",
                NameEn = "c",
                ExternalOsmId = "5",
                UpdatedAt = DateTime.UtcNow,
            },
            new StopLandmark
            {
                BusStopId = bothSkywalkStopA,
                LandmarkType = LandmarkType.Skywalk,
                NameTh = "s",
                NameEn = "s",
                ExternalOsmId = "6",
                UpdatedAt = DateTime.UtcNow,
            },
            new StopLandmark
            {
                BusStopId = bothSkywalkStopB,
                LandmarkType = LandmarkType.Skywalk,
                NameTh = "s",
                NameEn = "s",
                ExternalOsmId = "7",
                UpdatedAt = DateTime.UtcNow,
            });
        await dbContext.SaveChangesAsync();

        var candidates = new List<TestCandidate>
        {
            new("MixedLegs", 100, 0, skywalkStop, crossingStop, []),
            new("BothSkywalk", 100, 0, bothSkywalkStopA, bothSkywalkStopB, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(avoidStreetCrossing: true));

        // Assert
        Assert.Equal(["BothSkywalk", "MixedLegs"], result.Select(c => c.Name));
        Assert.DoesNotContain(result[1].Reasons, r => r.Code == ReasonCode.MatchesAvoidStreetCrossing);
    }

    [Fact]
    public async Task RankAsync_MultipleTogglesOn_CombineWithoutIgnoringEither()
    {
        // Arrange — unweighted rank-sum across 4 candidates: "WalkBest"/"TransferBest"
        // each win one axis outright but lose the other completely (combined rank 3),
        // "Other" is worst-ish on both (combined rank 4), and "Balanced" — good but not
        // best on either axis — wins overall (combined rank 2) specifically because
        // neither preference is weighted above the other.
        var (_, service) = CreateSubject();
        var candidates = new List<TestCandidate>
        {
            new("WalkBest", 100, 3, null, null, []),
            new("TransferBest", 400, 0, null, null, []),
            new("Balanced", 200, 1, null, null, []),
            new("Other", 300, 2, null, null, []),
        };

        // Act
        var result = await RankAsync(
            service, candidates, Preference(minimizeWalking: true, minimizeTransfers: true));

        // Assert
        Assert.Equal("Balanced", result[0].Name);
    }

    [Fact]
    public async Task RankAsync_NeverRemovesACandidate()
    {
        // Arrange
        var (_, service) = CreateSubject();
        var candidates = new List<TestCandidate>
        {
            new("A", 100, 0, null, null, []),
            new("B", 200, 0, null, null, []),
            new("C", 300, 0, null, null, []),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(minimizeWalking: true));

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(["A", "B", "C"], result.Select(c => c.Name).OrderBy(n => n));
    }

    [Fact]
    public async Task RankAsync_AppendsReasonRatherThanReplacingExisting()
    {
        // Arrange
        var (_, service) = CreateSubject();
        var existingReason = new EvaluationReason(ReasonCode.ReachesDestination);
        var candidates = new List<TestCandidate>
        {
            new("Near", 100, 0, null, null, [existingReason]),
            new("Far", 500, 0, null, null, [existingReason]),
        };

        // Act
        var result = await RankAsync(service, candidates, Preference(minimizeWalking: true));

        // Assert
        var winner = result.Single(c => c.Name == "Near");
        Assert.Contains(existingReason, winner.Reasons);
        Assert.Contains(winner.Reasons, r => r.Code == ReasonCode.MatchesMinimizeWalking);
    }

    private static async Task<int> SeedBusStopAsync(BusNavigateDbContext dbContext)
    {
        var stop = new BusStopEntity
        {
            ExternalStopId = Guid.NewGuid().ToString(),
            NameTh = "s",
            NameEn = "s",
            Latitude = 13.75m,
            Longitude = 100.5m,
        };
        dbContext.BusStops.Add(stop);
        await dbContext.SaveChangesAsync();
        return stop.Id;
    }
}
