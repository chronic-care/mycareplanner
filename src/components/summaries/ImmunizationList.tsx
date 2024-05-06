import React, { FC, useState, useEffect } from 'react';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { Immunization } from '../../data-services/fhir-types/fhir-r4';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface ImmunizationListProps {
  fhirDataCollection?: FHIRData[];
}

export const ImmunizationList: FC<ImmunizationListProps> = ({fhirDataCollection}) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ImmunizationList component RENDERED!");
  const [sortedImmunizations, setSortedImmunizations] = useState<Immunization[][] | undefined>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('');
  const [filterOption, setFilterOption] = useState<string[]>([]);
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [fhirDataCollection, sortOption, filterOption]);

  useEffect(() => {
    generateFilteringOptions();
  }, [fhirDataCollection]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
    setSortOption(sortOption);
    if(filterOption){
    setFilterOption(filterOption);
    }
    setShowModal(false);
  };

  const generateFilteringOptions = () => {
    if (!fhirDataCollection || fhirDataCollection.length === 0) {
      setFilteringOptions([]);
      return;
    }

    const uniqueServerNames = Array.from(new Set(fhirDataCollection.map(data => data.serverName)));
    const options = uniqueServerNames.map(value => ({
      value: value || '',
      label: value || '',
    }));

    setFilteringOptions(options);
  };

  const sortingOptions = [
    { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
    { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
    { value: 'newest', label: 'Date Created: Newest' },
    { value: 'oldest', label: 'Date Created: Oldest' },
  ];

  const applySortingAndFiltering = () => {
    if (!fhirDataCollection) return;
  
    const filtered = fhirDataCollection.map(data => {
      let immunizations = data?.immunizations;
  
      // Filtering logic modified to filter based on serverName
      if (filterOption.length > 0) {
        immunizations = immunizations?.filter(immunization =>
          data.serverName && filterOption.includes(data.serverName)
        );
      }
  
      return immunizations || [];
    });
  
    // Apply sorting to the filtered immunizations
    const sorted = filtered.map(immunizations => {
      if (!immunizations) return [];
  
      // Sorting logic remains the same as before
      switch (sortOption) {
        case 'newest':
          return immunizations.sort((a, b) => {
            const dateA = a.occurrenceDateTime ?? a.recorded;
            const dateB = b.occurrenceDateTime ?? b.recorded;
            return dateB.localeCompare(dateA);
          });
        case 'oldest':
          return immunizations.sort((a, b) => {
            const dateA = a.occurrenceDateTime ?? a.recorded;
            const dateB = b.occurrenceDateTime ?? b.recorded;
            return dateA.localeCompare(dateB);
          });
        case 'alphabetical-az':
          return immunizations.sort((a, b) => {
            const nameA = a.vaccineCode?.text?.toUpperCase() ?? '';
            const nameB = b.vaccineCode?.text?.toUpperCase() ?? '';
            return nameA.localeCompare(nameB);
          });
        case 'alphabetical-za':
          return immunizations.sort((a, b) => {
            const nameA = a.vaccineCode?.text?.toUpperCase() ?? '';
            const nameB = b.vaccineCode?.text?.toUpperCase() ?? '';
            return nameB.localeCompare(nameA);
          });
        default:
          return immunizations;
      }
    });
    setSortedImmunizations(sorted);
  };

  return (
    <div className="home-view">
      <div className="welcome">
        <h4 className="title">Immunizations</h4>

        {fhirDataCollection === undefined && (
          <>
            <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        )}

{fhirDataCollection && fhirDataCollection.length === 1 ? ( // Checking for single provider
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT
          </a>
        ) : (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT/FILTER
          </a>
        )}
 {showModal && ( // Conditional rendering of modal based on the number of providers
          fhirDataCollection && fhirDataCollection.length === 1 ? (
            <SortOnlyModal
              showModal={showModal}
              closeModal={closeModal}
              onSubmit={handleSortFilterSubmit}
              sortingOptions={sortingOptions}
            />
          ) : (
            <SortModal
              showModal={showModal}
              closeModal={closeModal}
              onSubmit={handleSortFilterSubmit}
              sortingOptions={sortingOptions}
              filteringOptions={filteringOptions}
            />
          )
        )}
        {sortedImmunizations?.map((immunizations, idx) => (
          <div key={idx}>
            {immunizations && immunizations.length > 0 ? (
              immunizations.map((imm, mIdx) => (
                <Summary key={mIdx} id={mIdx} rows={buildRows(imm, fhirDataCollection![idx].serverName)} />
              ))
            ) : (
              <p>No immunization records for this provider.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const buildRows = (imm: Immunization, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems = [
    {
      isHeader: true,
      twoColumns: false,
      data1: imm.vaccineCode?.text ?? "No text",
      data2: '',
    },
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Administered on: ' + (imm.occurrenceDateTime ? displayDate(imm.occurrenceDateTime) : 'Unknown'),
      data2: '',
    },
  ];

  if (imm.location) {
    const location: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'Location: ' + imm.location?.display,
      data2: undefined,
    };
    rows.push(location);
  }

  const notes: SummaryRowItems | undefined = imm.note?.map((note) => ({
    isHeader: false,
    twoColumns: false,
    data1: note.text ? 'Note: ' + note.text : '',
    data2: '',
  }));
  if (notes?.length) {
    rows = rows.concat(notes);
  }

  if (theSource) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'From ' + theSource,
      data2: '',
    };
    rows.push(source);
  }

  return rows;
};