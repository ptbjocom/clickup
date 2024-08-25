const baseUrl = "https://api.clickup.com/api/v2/";
const key = "pk_96850942_591HEW39XQ8E0WB3APJSSXOPKI9PXF3M";

const getFoldersUrl = baseUrl + "space/90181441183/folder";
const getListsUrl = baseUrl + "folder/$id$/list";
const getTasksUrl = baseUrl + "list/$id$/task?include_closed=true";

async function FetchData(url, paramId) {
  url = url.replace("$id$", paramId);
  try {
    let response = await fetch(url, {
      headers: {
        Authorization: key,
      },
    });
    if (!response.ok)
      throw new Error(
        `failed to fetch data: ${response.status} : ${response.statusText}`
      );
    let data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function init() {
  let villasLabelsList = [];

  const foldersData = await FetchData(getFoldersUrl);
  const villaPromises = foldersData.folders.map(async (f) => {
    let folderId = f.id;
    villasLabelsList.push(f.name);

    let listsData = await FetchData(getListsUrl, folderId);
    let actualSum = 0;
    let estimatedSum = 0;
    let listPromises = listsData.lists.map(async (list) => {
      let listId = list.id;

      let tasksData = await FetchData(getTasksUrl, listId);
      tasksData.tasks.forEach((task) => {
        if (task.custom_fields) {
          console.log(task.custom_fields);
          const estimateCost = task.custom_fields.find(
            (c) => c.id == "966dba7c-1fc9-4b08-8a90-e040d078dcb4"
          );
          const actualCost = task.custom_fields.find(
            (c) => c.id == "c5ad3e91-8716-4186-9092-e528ab47b331"
          );

          if (estimateCost && !isNaN(estimateCost.value)) {
            estimatedSum += estimateCost.value;
          }

          if (actualCost && !isNaN(actualCost.value)) {
            actualSum += +actualCost.value;
          }
        }
      });
    });
    await Promise.all(listPromises);
    return { villa: f.name, actual: actualSum, estimated: estimatedSum };
  });

  let finalData = await Promise.all(villaPromises);
  console.log(finalData);

  const canv = document.getElementById("actualCostChart");
  new Chart(canv, {
    type: "bar",
    data: {
      labels: [...finalData.map(d=> d.villa)],
      datasets: [
        {
          label: "Actual",
          data: [...finalData.map(d=> d.actual)],
        },
        {
          label: "Estimated",
          data: [...finalData.map(d=> d.estimated)],
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

init();
