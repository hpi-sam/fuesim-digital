export function getVersionedElementTypeDisplayName(
    // We cannot check if all VersionedElements are included, bc circular dependencies are hellish
    versionedElementType: string
): { singular: string; plural: string } | undefined {
    return {
        vehicleTemplate: { singular: 'Fahrzeug', plural: 'Fahrzeuge' },
        alarmGroup: { singular: 'Alarmgruppe', plural: 'Alarmgruppen' },
    }[versionedElementType];
}
