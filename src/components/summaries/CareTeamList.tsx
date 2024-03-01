import '../../Home.css';
import React from 'react';
import { FHIRData, displayPeriod } from '../../data-services/models/fhirResources';
import { CareTeamParticipant, Practitioner, Reference } from '../../data-services/fhir-types/fhir-r4';
import { Summary } from './Summary';

interface CareTeamListProps {
  fhirDataCollection?: FHIRData[],
}

function flatten(arr?: any) {
  return arr?.reduce(function (flat: any, toFlatten: any) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
  }, [])
}

function resolve(ref?: Reference, members?: Map<string, Practitioner>) {
  let resourceID: string | undefined = ref?.reference?.split('/').reverse()?.[0]
  return members?.get(resourceID ?? 'missing id')
}

export const CareTeamList: React.FC<CareTeamListProps> = (props: CareTeamListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("CareTeamList component RENDERED!")

  return (
    <div className="home-view">
      <div className="welcome">

        {props.fhirDataCollection?.map((data, idx) => {
          let participants: CareTeamParticipant[] = [];
          if (data.careTeams) {
            let partArrays = data.careTeams.map(team => team.participant);
            participants = flatten(partArrays) as CareTeamParticipant[];
          }

          let careTeamMembers = data.careTeamMembers || new Map();

          return (
            <div key={idx}>
              <h5 className="sectiontitle">{`Provider${idx + 1} - Primary Care Physician`}</h5>
              <p>{data.patientPCP?.name?.[0].text ?? "Name not provided"}</p>

              <h4 className="title">{`Provider${idx + 1} - Care Team`}</h4>

              {participants.length < 1
                ? <p>No records found.</p>
                :
                <>
                  {participants.map((participant, pIdx) => (
                    <Summary key={pIdx} id={pIdx} rows={[
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
              }
            </div>
          )
        })}

      </div>
    </div>
  )
}
