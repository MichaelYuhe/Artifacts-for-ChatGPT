import JSZip from "jszip";

const API_URL = "https://gateway.zeabur.com/graphql";

async function deployToZeabur(codes: string, name: string, language: string) {
  const convertedName = convertTitle(name);
  const file = new File([codes], `index.${language}`, {
    type: "text/plain",
  });

  const zip = new JSZip();

  zip.file(file.name, file);

  const content = await zip.generateAsync({ type: "blob" });
  const domain = await deploy(content, convertedName);

  return domain;
}

async function createTemporaryProject(): Promise<string> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation CreateTemporaryProject() {
                createTemporaryProject() {
                    _id
                }
            }`,
      }),
    });

    const { data } = await res.json();

    return data.createTemporaryProject._id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createService(
  projectID: string,
  serviceName: string
): Promise<string> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation CreateService($projectID: ObjectID!, $template: ServiceTemplate!, $name: String!) {
                createService(projectID: $projectID, template: $template, name: $name) {
                    _id
                }
            }`,
        variables: {
          projectID,
          template: "GIT",
          name: serviceName,
        },
      }),
    });

    const { data } = await res.json();

    return data.createService._id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getEnvironment(projectID: string): Promise<string> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query GetEnvironment($projectID: ObjectID!) {
                environments(projectID: $projectID) {
                    _id
                }
            }`,
        variables: {
          projectID,
        },
      }),
    });

    const { data } = await res.json();

    return data.environments[0]._id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createDomain(
  serviceID: string,
  environmentID: string,
  serviceName: string,
  domainName?: string
): Promise<string> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation CreateDomain($serviceID: ObjectID!, $environmentID: ObjectID!, $domain: String!, $isGenerated: Boolean!) {
                addDomain(serviceID: $serviceID, environmentID: $environmentID, domain: $domain, isGenerated: $isGenerated) {
                    domain
                }
            }`,
        variables: {
          serviceID,
          environmentID,
          domain: domainName ?? `${serviceName + generateRandomString()}`,
          isGenerated: true,
        },
      }),
    });

    const { data } = await res.json();
    return data.addDomain.domain;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deploy(code: Blob, serviceName: string) {
  try {
    if (!code) throw new Error("Code is required");

    const projectID = await createTemporaryProject();
    const environmentID = await getEnvironment(projectID);
    const serviceID = await createService(projectID, serviceName);

    const formData = new FormData();
    formData.append("environment", environmentID);
    formData.append("code", code, "code.zip");

    await fetch(
      `https://gateway.zeabur.com/projects/${projectID}/services/${serviceID}/deploy`,
      {
        method: "POST",
        body: formData,
      }
    );

    const domain = await createDomain(serviceID, environmentID, serviceName);

    return {
      projectID,
      domain,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function convertTitle(title: string) {
  return title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

function generateRandomString() {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export { deployToZeabur };
