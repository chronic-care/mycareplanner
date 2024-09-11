import '../../Home.css';
import React, { FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { MedicationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface MedicationListProps {
  fhirDataCollection?: FHIRData[],
  medicationSummaryMatrix?: MedicationSummary[][],
}

export const MedicationList: FC<MedicationListProps> = ({ fhirDataCollection, medicationSummaryMatrix }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("MedicationList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredMedications, setSortedAndFilteredMedications] = useState<{ medication: MedicationSummary, provider: string }[]>([]);
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [medicationSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (medicationSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [medicationSummaryMatrix]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
    setSortingOption(sortOption);
    if (filterOption) {
      setFilteringOption(filterOption);
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
    if (!medicationSummaryMatrix || !fhirDataCollection) return;

    // Flatten the medicationSummaryMatrix to a single array with provider information
    let combinedMedications: { medication: MedicationSummary, provider: string }[] = [];
    medicationSummaryMatrix.forEach((providerMedications, providerIndex) => {
      const providerName = fhirDataCollection[providerIndex].serverName || 'Unknown';
      providerMedications.forEach(medication => {
        combinedMedications.push({ medication, provider: providerName });
      });
    });

    // Apply filtering
    if (filteringOption.length > 0) {
      combinedMedications = combinedMedications.filter(({ provider }) => filteringOption.includes(provider));
    }

    // Apply sorting
    switch (sortingOption) {
      case 'alphabetical-az':
        combinedMedications.sort((a, b) => (a.medication.ConceptName || '').localeCompare(b.medication.ConceptName || ''));
        break;
      case 'alphabetical-za':
        combinedMedications.sort((a, b) => (b.medication.ConceptName || '').localeCompare(a.medication.ConceptName || ''));
        break;
      case 'newest':
        combinedMedications.sort((a, b) => (b.medication.AuthoredOn || '').localeCompare(a.medication.AuthoredOn || ''));
        break;
      case 'oldest':
        combinedMedications.sort((a, b) => (a.medication.AuthoredOn || '').localeCompare(b.medication.AuthoredOn || ''));
        break;
      default:
        break;
    }

    setSortedAndFilteredMedications(combinedMedications);
  };

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Medications</h4>

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

        {sortedAndFilteredMedications.length === 0 ? (
          <p>No records found.</p>
        ) : (
          sortedAndFilteredMedications.map(({ medication, provider }, index) => (
            <Summary key={index} id={index} rows={buildRows(medication, provider)} />
          ))
        )}
      </div>
    </div>
  );

}

const buildRows = (med: MedicationSummary, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems = [
    {
      isHeader: true,
      twoColumns: true,
      data1: med.ConceptName ?? "No text",
      data2: med.LearnMore === undefined || med.LearnMore === null ? '' :
        <Link to="route" target="_blank"
          onClick={
            (event) => { event.preventDefault(); window.open(med.LearnMore); }
          }><i>Learn&nbsp;More</i>
        </Link>,
    }
  ]

  if (med.Requester || med.AuthoredOn) {
    const requester: SummaryRowItem = {
      isHeader: false,
      twoColumns: true,
      data1: med.AuthoredOn ? 'Ordered On: ' + displayDate(med.AuthoredOn) : '',
      data2: med.Requester ? 'By: ' + (med.Requester) : '',
    }
    rows.push(requester)
  }

  if (med.DosageInstruction) {
    const requester: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: med.DosageInstruction,
      data2: '',
    }
    rows.push(requester)
  }

  const notes: SummaryRowItems | undefined = med.Notes?.map((note) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Note: ' + note,
      data2: '',
    }
  ));
  if (notes?.length) {
    rows = rows.concat(notes);
  }

  const provenance: SummaryRowItems | undefined = med.Provenance?.map((provenance) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Source: ' + provenance.Transmitter ?? '',
      data2: provenance.Author ?? '',
    }
  ))
  if (provenance?.length) {
    rows = rows.concat(provenance)
  }

  const hasProvenance = med.Provenance?.length ?? 0 > 0
  if (theSource && !hasProvenance) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'Source: ' + theSource,
      data2: '',
    }
    rows.push(source)
  }

  return rows;
}
