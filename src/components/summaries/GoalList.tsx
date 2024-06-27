import '../../Home.css';
import React, { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../data-services/models/fhirResources';
import { GoalSummary, GoalTarget } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';
import EditIcon from '@mui/icons-material/Edit';

interface GoalListProps {
  fhirDataCollection?: FHIRData[];
  goalSummaryMatrix?: GoalSummary[][];
  canShareData?: boolean;
}

export const GoalList: FC<GoalListProps> = ({ fhirDataCollection, goalSummaryMatrix, canShareData }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("GoalList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredGoals, setSortedAndFilteredGoals] = useState<{ goal: GoalSummary, provider: string }[]>([]);
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [goalSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (goalSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [goalSummaryMatrix]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
    setSortingOption(sortOption);
    if(filterOption){
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
    if (!goalSummaryMatrix || !fhirDataCollection) return;

    // Flatten the goalSummaryMatrix to a single array with provider information
    let combinedGoals: { goal: GoalSummary, provider: string }[] = [];
    goalSummaryMatrix.forEach((providerGoals, providerIndex) => {
      const providerName = fhirDataCollection[providerIndex].serverName || 'Unknown';
      providerGoals.forEach(goal => {
        combinedGoals.push({ goal, provider: providerName });
      });
    });

    // Apply filtering
    if (filteringOption.length > 0) {
      combinedGoals = combinedGoals.filter(({ provider }) => filteringOption.includes(provider));
    }

    // Apply sorting
    switch (sortingOption) {
      case 'alphabetical-az':
        combinedGoals.sort((a, b) => (a.goal.Description || '').localeCompare(b.goal.Description || ''));
        break;
      case 'alphabetical-za':
        combinedGoals.sort((a, b) => (b.goal.Description || '').localeCompare(a.goal.Description || ''));
        break;
      case 'newest':
        combinedGoals.sort((a, b) => (b.goal.StartDate || '').localeCompare(a.goal.StartDate || ''));
        break;
      case 'oldest':
        combinedGoals.sort((a, b) => (a.goal.StartDate || '').localeCompare(b.goal.StartDate || ''));
        break;
      default:
        break;
    }

    setSortedAndFilteredGoals(combinedGoals);
  };

  return (
    <div className="home-view">
      <div className="welcome">
        <h4 className="title">Health Goals</h4>

        {fhirDataCollection === undefined && (
          <>
            <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        )}

        {canShareData && (
          <p>
            <Link to={{ pathname: '/goal-edit', state: { fhirDataCollection } }}>
              Add a New Goal
            </Link>
          </p>
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

        {sortedAndFilteredGoals.length === 0 ? (
          <p>No records found.</p>
        ) : (
          sortedAndFilteredGoals.map(({ goal, provider }, index) => (
            <Summary key={index} id={index} rows={buildRows(goal, provider)} />
          ))
        )}
      </div>
    </div>
  );
};

const buildRows = (goal: GoalSummary, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems = [
    {
      isHeader: true,
      twoColumns: false,
      data1: goal.Description,
      data2: '',
    },
    {
      isHeader: false,
      twoColumns: true,
      data1: goal.ExpressedBy,
      data2: goal.StartDate === null ? '' : 'Start: ' + goal.StartDate,
    },
  ];
//add "SDS Data" instead of "Data SDS"
  if (theSource === 'Data SDS') {
    rows.unshift({
      isHeader: false,
      twoColumns: false,
      data1: (
        <>
          <Link
            to={{
              pathname: '/goal-edit',
              state: {
                goalData: goal,
                prepopulatedDescription: goal.Description,
                prepopulatedDate: goal.StartDate || null,
                prepopulatedDueDate: goal?.Target?.[0]?.DueDate || null
              }
            }}
          >
            <div style={{ color: '#355CA8', textAlign: 'right', marginLeft: 'auto' }}>
            <EditIcon/>
            </div>
          </Link>
        </>
      ),
      data2: '',
    });
  }

  const targets: SummaryRowItems = buildTargets(goal);
  if (targets?.length) {
    rows = rows.concat(targets);
  }

  const status: SummaryRowItem = {
    isHeader: false,
    twoColumns: false,
    data1: 'Status: ' + (goal.LifecycleStatus ?? 'Unknown') + (goal.AchievementStatus === null ? '' : ' -- ' + goal.AchievementStatus),
    data2:'',
  }
  rows = rows.concat(status)

  const addresses: SummaryRowItems | undefined = goal.Addresses?.map(focus => ({
    isHeader: false,
    twoColumns: false,
    data1: 'Focus: ' + (focus.DisplayName ?? 'Unknown'),
    data2: '',
  }));
  if (addresses?.length) {
    rows = rows.concat(addresses);
  }

  if (goal.LearnMore !== undefined && goal.LearnMore !== null) {
    const learnMore: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1:
        <Link to="route" target="_blank"
          onClick={
            (event) => { event.preventDefault(); window.open(goal.LearnMore); }
          }><i>Learn&nbsp;More</i>
        </Link>,
      data2: '',
    }
    rows.push(learnMore)
  }

  const notes: SummaryRowItems | undefined = goal.Notes?.map(note => ({
    isHeader: false,
    twoColumns: false,
    data1: 'Note: ' + note,
    data2: '',
  }));
  if (notes?.length) {
    rows = rows.concat(notes);
  }

  const provenance: SummaryRowItems | undefined = goal.Provenance?.map((provenance) => (
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

  const hasProvenance = goal.Provenance?.length ?? 0 > 0
  if (theSource && !hasProvenance) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'Source ' + theSource,
      data2: '',
    }
    rows.push(source)
  }

  return rows;
};

const buildTargets = (goal: GoalSummary): SummaryRowItems => {
  let targets: SummaryRowItems = [];

  goal.Target?.forEach(curTarget => {
    let isPushLastResultTextAndDateOnly: boolean =
      (curTarget.DueDate === null || curTarget.DueDate === undefined) &&
      (curTarget.TargetValue === null || curTarget.TargetValue === undefined);

    let isPushTargetValueAndDueDateOnly: boolean = !curTarget.LastResult || !curTarget.LastResult.Date;

    let isPushBoth = !isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly;

    if (isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly) {
      targets.push(buildLastResultTextAndDate(curTarget));
    } else if (isPushTargetValueAndDueDateOnly && !isPushLastResultTextAndDateOnly) {
      targets.push(buildTargetValueAndDueDate(curTarget));
    } else if (isPushBoth) {
      targets.push(buildTargetValueAndDueDate(curTarget));
      targets.push(buildLastResultTextAndDate(curTarget));
    }
  });

  return targets;
};

const buildLastResultTextAndDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: false,
    data1: 'Last Value: ' + (curTarget.LastResult?.ResultText ?? '?') + ' on ' + (curTarget.LastResult?.Date || ''),
    data2: '',
  };
};

const buildTargetValueAndDueDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: true,
    data1: curTarget.TargetValue === null ? '' : 'Target: ' + curTarget.TargetValue,
    data2: curTarget.DueDate === null ? '' : 'Due: ' + curTarget.DueDate,
  };
};