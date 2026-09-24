// Mirrors backend/BusNavigate.Domain/Interfaces/TripPlanning/PlaceKind.cs — numeric
// values matter, System.Text.Json serializes the enum as a number, not a string.
export enum PlaceKind {
    BusStop = 0,
    Place = 1
}

// Mirrors backend/BusNavigate.Domain/ViewModels/TripPlanning/PlaceSearchResult.cs.
export interface PlaceSearchResult {
    id: number;
    type: PlaceKind;
    nameTh: string;
    nameEn: string;
    latitude: number;
    longitude: number;
}
