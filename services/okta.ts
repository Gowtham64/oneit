import { Client } from "@okta/okta-sdk-nodejs";

const getClient = () => {
    if (!process.env.OKTA_DOMAIN || !process.env.OKTA_API_TOKEN) {
        throw new Error("Okta credentials not found");
    }
    return new Client({
        orgUrl: process.env.OKTA_DOMAIN,
        token: process.env.OKTA_API_TOKEN,
    });
};

export async function createOktaUser(
    firstName: string,
    lastName: string,
    email: string,
    groupids: string[] = []
) {
    try {
        const newUser = {
            profile: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                login: email,
            },
        };

        // @ts-ignore - The SDK types might be mismatching in this environment
        const user = await getClient().createUser(newUser);

        // Add user to groups if provided
        if (groupids.length > 0 && user.id) {
            for (const groupId of groupids) {
                // @ts-ignore
                await getClient().addToGroup(groupId, user.id);
            }
        }

        return user;
    } catch (error) {
        console.error("Error creating Okta user:", error);
        throw error;
    }
}

export async function deactivateOktaUser(userId: string) {
    try {
        // @ts-ignore
        await getClient().deactivateUser(userId);
        return true;
    } catch (error) {
        console.error("Error deactivating Okta user:", error);
        throw error;
    }
}
