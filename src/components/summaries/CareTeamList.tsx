import '../../Home.css';
import React from 'react';
import { FHIRData, displayPeriod } from '../../data-services/models/fhirResources';
import { CareTeamParticipant, Practitioner, Reference } from '../../data-services/fhir-types/fhir-r4';
import { Summary } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';

interface CareTeamListProps {
  // TODO:MULTI-PROVIDER Make fhirDataCollection make sense for a collection. 4 indexs were added (noted where added)
  // We likely have to update the what get Summary method that returns immunizations as well???
  // Maybe we are all good with just updating fhirDataCollection since immunizations appears to come right from it...
  fhirDataCollection?: FHIRData[],
}

function flatten(arr?: any) {
  return arr?.reduce(function (flat: any, toFlatten: any) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function resolve(ref?: Reference, members?: Map<string, Practitioner>) {
  let resourceID: string | undefined = ref?.reference?.split('/').reverse()?.[0]
  return members?.get(resourceID ?? 'missing id')
}

export const CareTeamList: React.FC<CareTeamListProps> = (props: CareTeamListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("CareTeamList component RENDERED!")

  // an array of arrays
  // TODO:MULTI-PROVIDER index added on next line but need to support full collection
  let participantArrays = props.fhirDataCollection && props.fhirDataCollection[0]?.careTeams?.map((team) => team.participant)
  // flatten into CareTeamParticipant[]
  let participants: CareTeamParticipant[] | undefined = flatten(participantArrays) as CareTeamParticipant[]

  //  Map<string,Practitioner>
  // TODO:MULTI-PROVIDER index added on next line but need to support full collection
  let careTeamMembers = props.fhirDataCollection && props.fhirDataCollection[0]?.careTeamMembers
  // let practitioners = careTeamMembers != undefined ? Array.from(careTeamMembers!.values()) : []

  // TODO sort care team participants by family name

  return (
    <div className="home-view">
      <div className="welcome">

        <h5 className="sectiontitle">Primary Care Physician</h5>
        {/* TODO:MULTI-PROVIDER index added on next 2 lines but need to support full collection */}
        {props.fhirDataCollection && props.fhirDataCollection[0]?.patientPCP === undefined ? <p>Not available</p> :
          <p>{(props.fhirDataCollection && props.fhirDataCollection[0]?.patientPCP?.name?.[0].text) ?? "Name not provided"}</p>
        }

        <h4 className="title">Care Team</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        {((participants?.length ?? 0) < 1) && props.fhirDataCollection !== undefined
          ? <p>No records found.</p>
          :
          <>
            {participants?.map((participant, idx) => (

              <Summary key={idx} id={idx} rows={[
                {
                  isHeader: true,
                  twoColumns: false,
                  data1: resolve(participant.member, careTeamMembers)?.name?.[0].text
                    ?? participant.member?.display
                    ?? participant.member?.reference ?? "No name",
                  data2: '',
                },
                {
                  isHeader: false,
                  twoColumns: false,
                  data1: "Role: " + (participant.role?.[0].text ?? "No role"),
                  data2: '',
                },
                {
                  isHeader: false,
                  twoColumns: false,
                  data1: participant.period === undefined ? '' : "Time Period: " + displayPeriod(participant.period),
                  data2: '',
                },
              ]} />

            ))}
          </>

          /* May need to be implemented in header:
            <tr><td><b>{participant.member?.display ?? "No name"}</b></td></tr> */
        }

      </div>
    </div>
  )

}
