import { 
  Configuration, 
  PublicClientApplication, 
  IPublicClientApplication, 
  AccountInfo, 
  InteractionRequiredAuthError 
} from "@azure/msal-browser";

const TENANT_ID = "0ecb7c82-1b84-4b36-adef-2081b5c1125b";
const CLIENT_ID = "af39ad67-ec03-4cbd-88f3-762dd7a58dfe";

export const msalConfig: Configuration = {
    auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        redirectUri: "http://localhost:3000"
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false,
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const getAuthToken = async (
  instance: IPublicClientApplication, 
  account: AccountInfo
): Promise<string> => {
  
  const scopes = ["api://af39ad67-ec03-4cbd-88f3-762dd7a58dfe/access_as_user"]; 
  
  try {
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: scopes,
      account: account
    });
    return tokenResponse.accessToken;
  
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      console.warn("Silent token failed, acquiring with popup...");
      try {
        const tokenResponse = await instance.loginPopup({
          scopes: scopes 
        });
        return tokenResponse.accessToken;
      } catch (popupError) {
        console.error("Popup token acquisition failed:", popupError);
        throw new Error("Login failed during token refresh");
      }
    }
    console.error("Token acquisition failed:", error);
    throw new Error("Could not acquire token");
  }
};