export interface UserPreference {
    minimizeWalking: boolean;
    minimizeTransfers: boolean;
    avoidStreetCrossing: boolean;
    updatedAt: string | null;
}

export type UserPreferenceToggles = Pick<
    UserPreference,
    'minimizeWalking' | 'minimizeTransfers' | 'avoidStreetCrossing'
>;
