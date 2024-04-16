import '../../Home.css';
import React, { useState, useEffect } from 'react';
import { FHIRData, displayTiming, displayConcept } from '../../data-services/models/fhirResources';
import { ServiceRequest } from '../../data-services/fhir-types/fhir-r4';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';

interface ServiceRequestListProps {
  fhirDataCollection?: FHIRData[];
}

export const ServiceRequestList: React.FC<ServiceRequestListProps> = (props: ServiceRequestListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ServiceRequestList component RENDERED!");

  const [sortedServiceRequests, setSortedServiceRequests] = useState<ServiceRequest[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('');
  const [filterOption, setFilterOption] = useState<string>('');
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);
  const [hashMap, setHashMap] = useState<Map<ServiceRequest, string>>(new Map());

  useEffect(() => {
    applySorting();
  }, [props.fhirDataCollection, sortOption, filterOption]);

  useEffect(() => {
    if (props.fhirDataCollection) {
      generateHashMap(props.fhirDataCollection);
    }
  }, [props.fhirDataCollection]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption: string) => {
    setSortOption(sortOption);
    setFilterOption(filterOption);
    setShowModal(false);
  };

  const applySorting = () => {
    let serviceRequests: ServiceRequest[] = [];
  
    if (props.fhirDataCollection) {
      props.fhirDataCollection.forEach(data => {
        if (data.serviceRequests) {
          serviceRequests = serviceRequests.concat(data.serviceRequests);
        }
      });
    }
  
    let sortedServiceRequests = [...serviceRequests];
  
    if (sortOption === 'alphabetical-az') {
      sortedServiceRequests = sortedServiceRequests.sort((a, b) => {
        const nameA = a.code?.text ?? "";
        const nameB = b.code?.text ?? "";
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === 'alphabetical-za') {
      sortedServiceRequests = sortedServiceRequests.sort((a, b) => {
        const nameA = a.code?.text ?? "";
        const nameB = b.code?.text ?? "";
        return nameB.localeCompare(nameA);
      });
    } else if (sortOption === 'newest') {
      serviceRequests = serviceRequests.sort((a, b) => {
        const dateA = a.occurrenceTiming?.repeat ?? "";
        const dateB = b.occurrenceTiming?.repeat ?? "";
        console.log("dateA", dateA);
        return 1;
      });
    } else if (sortOption === 'oldest') {
      serviceRequests = serviceRequests.sort((a, b) => {
        const dateA = a.occurrenceTiming?.repeat ?? "";
        const dateB = b.occurrenceTiming?.repeat ?? "";
        return 1;
      });
    }
  
    if (filterOption) {
      sortedServiceRequests = sortedServiceRequests.filter((service) => displayConcept(service.code) === filterOption);
    }
  
    setSortedServiceRequests(sortedServiceRequests);
  };
  

  const generateHashMap = (dataCollection: FHIRData[]) => {
    const newHashMap = new Map<ServiceRequest, string>();

    dataCollection.forEach(data => {
      if (data.serviceRequests) {
        data.serviceRequests.forEach(sr => {
          newHashMap.set(sr, data.serverName || '');
        });
      }
    });

    setHashMap(newHashMap);
    generateFilteringOptions(newHashMap);
  };

  const generateFilteringOptions = (hashMap: Map<ServiceRequest, string>) => {
    const sourceValues: string[] = Array.from(hashMap.values());
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
        <h4 className="title">Planned Activities</h4>

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

        {sortedServiceRequests.length > 0 ? (
          sortedServiceRequests.map((service, idx) => (
            <Summary key={idx} id={idx} rows={buildRows(service, hashMap.get(service))} />
          ))
        ) : (
          <p>No records found.</p>
        )}

      </div>
    </div>
  );
};

const buildRows = (service: ServiceRequest, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: displayConcept(service.code) ?? "No description",
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: service.requester === undefined ? ''
          : 'Requested by: ' + service.requester?.display,
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: service.occurrenceTiming === undefined ? ''
          : 'Scheduled on ' + displayTiming(service.occurrenceTiming),
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: service.reasonCode === undefined ? ''
          : 'Reason: ' + displayConcept(service.reasonCode?.[0]),
        data2: '',
      }
    ];

  const notes: SummaryRowItems | undefined = service.note?.map((note, idx) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: note.text ? 'Note ' + (idx + 1) + ': ' + note.text : '',
      data2: '',
    }
  ));
  if (notes?.length) {
    rows = rows.concat(notes);
  }

  if (theSource) {
    const rowItem: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: "From " + theSource,
      data2: '',
    };
    rows.push(rowItem);
  }

  return rows;
};
