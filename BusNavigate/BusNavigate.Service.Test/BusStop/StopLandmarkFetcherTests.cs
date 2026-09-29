using BusNavigate.Domain.Interfaces.BusStop;
using BusNavigate.Service.Extensions;
using Microsoft.Extensions.DependencyInjection;

namespace BusNavigate.Service.Test.BusStop;

public class StopLandmarkFetcherTests
{
    [Fact]
    public void AddBusStopContext_ConfiguresOverpassHttpHeaders()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBusStopContext();
        using var provider = services.BuildServiceProvider();

        // Act
        var clientFactory = provider.GetRequiredService<IHttpClientFactory>();
        var client = clientFactory.CreateClient(nameof(IStopLandmarkFetcher));

        // Assert
        Assert.Contains(
            client.DefaultRequestHeaders.UserAgent,
            value => value.Product?.Name == "BusNavigate" && value.Product?.Version == "1.0");
        Assert.Contains(
            client.DefaultRequestHeaders.Accept,
            value => value.MediaType == "application/json");
    }
}
