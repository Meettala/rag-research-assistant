Orbital Labs: Engineering Onboarding Handbook

Orbital Labs is a synthetic organisation created for evaluation purposes only. This handbook is fictional and describes no real company, product, team or person.

Welcome and purpose. This handbook explains how engineering work moves from an idea to something running in front of users. It is deliberately short. Anything that changes more often than once a quarter lives in the team wiki instead, so that this document stays trustworthy.

How work is chosen. Every piece of engineering work begins as a written problem statement rather than a proposed solution. The problem statement names who is affected, how often the problem occurs, and what currently happens instead. Work that cannot be written this way is sent back. This rule exists because the team found that solutions proposed before the problem was understood were the most common source of wasted effort.

Review expectations. All changes are reviewed by at least one other engineer before merging. Reviewers are asked to comment on correctness, on failure behaviour, and on whether the change is tested. Reviewers are explicitly not asked to comment on personal style preferences. A review should be returned within one working day; if the reviewer cannot manage that, they should hand the review to someone else rather than let it sit.

Testing philosophy. A change that alters behaviour must add a test that would fail without it. The team values negative tests highly, meaning tests that prove a system refuses to do something, declines safely, or fails in a predictable way. A suite made only of tests that prove things work is considered incomplete.

Deployment. Changes are deployed continuously once they pass the automated pipeline. There is no scheduled release window and no release manager role. Any engineer may deploy. The person who deploys a change is responsible for watching it for the following hour. Rollback is always preferred over a forward fix when the cause is not yet understood.

Incidents. When something breaks, the first priority is restoring service and the second is understanding why. Incident write ups are blameless and are read by the whole engineering group. The write up must state what was known at each point in time, not only what turned out to be true afterwards.

On call. On call rotation is weekly and voluntary in the first three months of employment. Engineers are compensated for on call time. Nobody is expected to be reachable outside their rotation.

What this handbook does not cover. Compensation, holiday policy, visa support, hardware requests and expense claims are handled by the operations team and are not described here.
