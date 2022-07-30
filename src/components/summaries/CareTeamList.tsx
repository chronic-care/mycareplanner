import '../../Home.css'
import React from 'react'
import { FHIRData } from '../../data-services/models/fhirResources'
import { PatientSummary, ScreeningSummary } from '../../data-services/models/cqlSummary'
import { CareTeamParticipant, Practitioner, Reference } from '../../data-services/fhir-types/fhir-r4';

interface CareTeamListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface CareTeamListState {
}

function flatten(arr?: any) {
  return arr?.reduce(function (flat: any, toFlatten: any) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function resolve(ref?: Reference, members?: Map<string,Practitioner>)  {
  let resourceID: string | undefined = ref?.reference?.split('/').reverse()?.[0]
  return members?.get(resourceID ?? 'missing id')
}

export const CareTeamList: React.FC<CareTeamListProps> = (props: CareTeamListProps) => {
  // an array of arrays
  let participantArrays = props.fhirData?.careTeams?.map((team) => team.participant)
  // flatten into CareTeamParticipant[]
  let participants: CareTeamParticipant[] | undefined = flatten(participantArrays) as CareTeamParticipant[]

  //  Map<string,Practitioner>
  let careTeamMembers = props.fhirData?.careTeamMembers
  // let practitioners = careTeamMembers != undefined ? Array.from(careTeamMembers!.values()) : []

  // TODO sort care team participants by family name

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Care Team</h4>

        {(participants?.length ?? 0) < 1 ? <p>No records found.</p> :
          <table><tbody>
            {participants?.map((participant, idx) => (
              <tr key={idx}>
                <td>
                  <table><tbody>
                    {/* <tr><td><b>{participant.member?.display ?? "No name"}</b></td></tr> */}
                    <tr><td><b>{resolve(participant.member, careTeamMembers)?.name?.[0].text 
                          ?? participant.member?.display
                          ?? participant.member?.reference ?? "No name"}</b></td></tr>
                    <tr><td>Role: {participant.role?.[0].text ?? "No role"}</td></tr>
                  </tbody></table>
                </td>
              </tr>
            ))}
          </tbody></table>
        }

      </div>
    </div>
  )

}
