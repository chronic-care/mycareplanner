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

export const ImmunizationList: FC<ImmunizationListProps> = ({ fhirDataCollection }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ImmunizationList component RENDERED!");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('');
  const [filterOption, setFilterOption] = useState<string[]>([]);
  const [sortedAndFilteredImmunizations, setSortedAndFilteredImmunizations] = useState<{ immunization: Immunization, provider: string }[]>([]);
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
    if (filterOption) {
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

    let combinedImmunizations: { immunization: Immunization, provider: string }[] = [];

    fhirDataCollection.forEach((data, providerIndex) => {
      const providerName = data.serverName || 'Unknown';
      (data.immunizations || []).forEach(immunization => {
        combinedImmunizations.push({ immunization, provider: providerName });
      });
    });

    // Apply filtering
    if (filterOption.length > 0) {
      combinedImmunizations = combinedImmunizations.filter(({ provider }) => filterOption.includes(provider));
    }

    // Apply sorting
    switch (sortOption) {
      case 'alphabetical-az':
        combinedImmunizations.sort((a, b) => (a.immunization.vaccineCode?.text || '').localeCompare(b.immunization.vaccineCode?.text || ''));
        break;
      case 'alphabetical-za':
        combinedImmunizations.sort((a, b) => (b.immunization.vaccineCode?.text || '').localeCompare(a.immunization.vaccineCode?.text || ''));
        break;
      case 'newest':
        combinedImmunizations.sort((a, b) => {
          const dateA = a.immunization.occurrenceDateTime || a.immunization.recorded || '';
          const dateB = b.immunization.occurrenceDateTime || b.immunization.recorded || '';
          return dateB.localeCompare(dateA);
        });
        break;
      case 'oldest':
        combinedImmunizations.sort((a, b) => {
          const dateA = a.immunization.occurrenceDateTime || a.immunization.recorded || '';
          const dateB = b.immunization.occurrenceDateTime || b.immunization.recorded || '';
          return dateA.localeCompare(dateB);
        });
        break;
      default:
        break;
    }

    setSortedAndFilteredImmunizations(combinedImmunizations);
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

        {fhirDataCollection && fhirDataCollection.length === 1 ? (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT
          </a>
        ) : (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT/FILTER
          </a>
        )}

        {showModal && (
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

        {sortedAndFilteredImmunizations.length === 0 ? (
          <p>No records found.</p>
        ) : (
          sortedAndFilteredImmunizations.map(({ immunization, provider }, index) => (
            <Summary key={index} id={index} rows={buildRows(immunization, provider)} />
          ))
        )}
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
