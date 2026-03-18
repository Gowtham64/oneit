import { google } from "googleapis";

const SCOPES = [
    "https://www.googleapis.com/auth/admin.directory.user",
    "https://www.googleapis.com/auth/admin.directory.group",
];

const getAdmin = () => {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_ADMIN_EMAIL) {
        throw new Error("Google credentials not found");
    }

    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: SCOPES,
        subject: process.env.GOOGLE_ADMIN_EMAIL,
    });

    return google.admin({ version: "directory_v1", auth });
};

export async function createGoogleUser(
    email: string,
    fullName: string,
    orgUnitPath: string = '/'
) {
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    try {
        const res = await getAdmin().users.insert({
            requestBody: {
                name: {
                    givenName: firstName,
                    familyName: lastName,
                },
                primaryEmail: email,
                password: Math.random().toString(36).slice(-8), // Generate random password
                changePasswordAtNextLogin: true,
                orgUnitPath: orgUnitPath, // Place user in specified OU
            },
        });
        return res.data;
    } catch (error) {
        console.error("Error creating Google user:", error);
        throw error;
    }
}

export async function deleteGoogleUser(email: string) {
    try {
        await getAdmin().users.delete({
            userKey: email,
        });
        return true;
    } catch (error) {
        console.error("Error deleting Google user:", error);
        throw error;
    }
}
