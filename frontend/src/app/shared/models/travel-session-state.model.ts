// Mirrors backend/BusNavigate.Domain/Entities/TravelSessionState.cs — numeric values
// matter, System.Text.Json serializes the enum as a number, not a string.
export enum TravelSessionState {
    Planned = 0,
    WalkingToStop = 1,
    Waiting = 2,
    Riding = 3,
    Misboarded = 4,
    Alighted = 5,
    Completed = 6,
    Abandoned = 7
}

export function isTerminalTravelSessionState(state: TravelSessionState): boolean {
    return state === TravelSessionState.Completed || state === TravelSessionState.Abandoned;
}
