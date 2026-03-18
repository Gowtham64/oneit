import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";

const getClient = () => {
    if (!process.env.AZURE_AD_TENANT_ID || !process.env.AZURE_AD_CLIENT_ID || !process.env.AZURE_AD_CLIENT_SECRET) {
        throw new Error("Azure AD credentials not found");
    }

    const credential = new ClientSecretCredential(
        process.env.AZURE_AD_TENANT_ID,
        process.env.AZURE_AD_CLIENT_ID,
        process.env.AZURE_AD_CLIENT_SECRET
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ["https://graph.microsoft.com/.default"],
    });

    return Client.initWithMiddleware({
        authProvider: authProvider,
    });
};

export async function createMicrosoftUser(
    firstName: string,
    lastName: string,
    email: string, // UserPrincipalName
    password?: string
) {
    try {
        const user = {
            accountEnabled: true,
            displayName: `${firstName} ${lastName}`,
            mailNickname: email.split("@")[0],
            userPrincipalName: email,
            passwordProfile: {
                forceChangePasswordNextSignIn: true,
                password: password || Math.random().toString(36).slice(-8) + "Aa1!", // Simple random password meeting complexity requirements
            },
        };

        const res = await getClient().api("/users").post(user);
        return res;
    } catch (error) {
        console.error("Error creating Microsoft user:", error);
        throw error;
    }
}

export async function deleteMicrosoftUser(userId: string) {
    try {
        await getClient().api(`/users/${userId}`).delete();
        return true;
    } catch (error) {
        console.error("Error deleting Microsoft user:", error);
        throw error;
    }
}
