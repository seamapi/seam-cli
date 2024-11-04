import prompts from "prompts"
import { getSeam } from "./get-seam"
import { withLoading } from "./util/with-loading"

export const interactForAcsEntrance = async () => {
  const seam = await getSeam()

  const entrances = await withLoading("Fetching ACS entrances...", () =>
    seam.acs.entrances.list()
  )

  const { acsEntranceId } = await prompts({
    name: "acsEntranceId",
    type: "autocomplete",
    message: "Select an ACS Entrance:",
    choices: entrances.map((entrance: any) => ({
      title: entrance.display_name ?? "<No Name>",
      value: entrance.acs_entrance_id,
      description: entrance.acs_entrance_id,
    })),
  })

  return acsEntranceId
}
