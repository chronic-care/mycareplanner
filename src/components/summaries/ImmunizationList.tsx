import '../../Home.css';
import React, { useState, useEffect } from 'react';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { Immunization } from '../../data-services/fhir-types/fhir-r4';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
interface ImmunizationListProps {
  fhirDataCollection?: FHIRData[],
}

export const ImmunizationList: React.FC<ImmunizationListProps> = (props: ImmunizationListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ImmunizationList component RENDERED!")
  const [sortedImmunizations, setSortedImmunizations] = useState<Immunization[][] | undefined>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('');
  const [filterOption, setFilterOption] = useState<string>('');
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  console.log("ImmunizationList", props.fhirDataCollection);

  useEffect(() => {
    applySorting();
  }, [props.fhirDataCollection, sortOption, filterOption]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption: string) => {
    setSortOption(sortOption);
    setFilterOption(filterOption);
    setShowModal(false);
  };

  const applySorting = () => {
    const sorted = props.fhirDataCollection?.map(data => {
      let immunizations = data?.immunizations;
      if (sortOption === 'newest') {
        immunizations = immunizations?.sort((a, b) => {
          const dateA = a.occurrenceDateTime ?? a.recorded;
          const dateB = b.occurrenceDateTime ?? b.recorded;
          return dateB.localeCompare(dateA);
        });
      } else if (sortOption === 'oldest') {
        immunizations = immunizations?.sort((a, b) => {
          const dateA = a.occurrenceDateTime ?? a.recorded;
          const dateB = b.occurrenceDateTime ?? b.recorded;
          return dateA.localeCompare(dateB);
        });
      } else if (sortOption === 'alphabetical-az') {
        immunizations = immunizations?.sort((a, b) => {
          const nameA = a.vaccineCode?.text?.toUpperCase() ?? '';
          const nameB = b.vaccineCode?.text?.toUpperCase() ?? '';
          return nameA.localeCompare(nameB);
        });
      } else if(sortOption === 'alphabetical-za'){
        immunizations = immunizations?.sort((a, b) => {
          const nameA = a.vaccineCode?.text?.toUpperCase() ?? '';
          const nameB = b.vaccineCode?.text?.toUpperCase() ?? '';
          return nameB.localeCompare(nameA);
        });
      }
      
      if (filterOption) {
        immunizations = immunizations?.filter((immunization) => immunization.location?.display === filterOption);
      }

      return immunizations || [];
    });

    setSortedImmunizations(sorted);
  };

  const generateFilteringOptions = () => {
    if (!props.fhirDataCollection) return;

    const sourceValues: string[] = [];

    props.fhirDataCollection.forEach(data => {
      data?.immunizations?.forEach(immunization => {
        if (immunization.location?.display) {
          sourceValues.push(immunization.location.display);
        }
      });
    });

    const uniqueSourceValues = Array.from(new Set(sourceValues));

    const options = uniqueSourceValues.map(value => ({
      value: value,
      label: value
    }));

    setFilteringOptions(options);
  };

  return (
    <div className="home-view">
      <div className="welcome">
        <h4 className="title">Immunizations</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        <a className="text-right" onClick={() => setShowModal(true)}>
          SORT/FILTER
        </a>
        <SortModal
          showModal={showModal}
          closeModal={closeModal}
          onSubmit={handleSortFilterSubmit}
          sortingOptions={[
            { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
            { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
            { value: 'newest', label: 'Date: Newest' },
            { value: 'oldest', label: 'Date: Oldest' }
          ]}
          filteringOptions={filteringOptions}
        />
        {sortedImmunizations?.map((immunizations, idx) => (
          <div key={idx}>
            {immunizations && immunizations.length > 0 ? (
              immunizations.map((med, mIdx) => (
                <Summary key={mIdx} id={mIdx} rows={buildRows(med, props.fhirDataCollection![idx].serverName)} />
              ))
            ) : (
              <p>No immunization records for this provider.</p>
            )}
          </div>
        ))}
      </div>
    </div>

  )
}

const buildRows = (med: Immunization, theSource?:string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: med.vaccineCode?.text ?? "No text",
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: 'Administered on: ' + (med.occurrenceDateTime ? displayDate(med.occurrenceDateTime) : 'Unknown'),
        data2: '',
      },
    ]

  if (med.location) {
    const location: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'Location: ' + med.location?.display,
      data2: undefined
    }
    rows.push(location)
  }

  const notes: SummaryRowItems | undefined = med.note?.map((note) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: note.text ? 'Note: ' + note.text : '',
      data2: '',
    }
  ))
  if (notes?.length) {
    rows = rows.concat(notes)
  }

  if (theSource) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'From ' + theSource,
      data2: '',
    }
    rows.push(source)
  }
console.log("rows", rows);
  return rows
}
