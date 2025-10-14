;; VoxCard Savings - Community Savings & Rotating Credit on Stacks
;; A decentralized platform for Ajo/Esusu-style savings groups with trust scoring
;; Built for the Stacks Builders Challenge - Embedded Wallet Integration

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Contract owner
(define-constant contract-owner tx-sender)

;; Error codes with descriptive names
(define-constant err-owner-only (err u100))
(define-constant err-not-authorized (err u101))
(define-constant err-group-not-found (err u102))
(define-constant err-already-participant (err u103))
(define-constant err-group-full (err u104))
(define-constant err-insufficient-trust-score (err u105))
(define-constant err-invalid-contribution (err u106))
(define-constant err-already-contributed-this-cycle (err u107))
(define-constant err-not-participant (err u108))
(define-constant err-group-inactive (err u109))
(define-constant err-invalid-group-parameters (err u110))
(define-constant err-join-request-not-found (err u111))
(define-constant err-contribution-below-minimum (err u112))
(define-constant err-partial-payment-not-allowed (err u113))

;; Group status constants
(define-constant status-active u1)
(define-constant status-inactive u0)

;; Frequency options
(define-constant frequency-daily "Daily")
(define-constant frequency-weekly "Weekly")
(define-constant frequency-biweekly "Biweekly")
(define-constant frequency-monthly "Monthly")

;; Minimum contribution amount (100 microSTX = 0.0001 STX)
(define-constant min-contribution-amount u100)

;; Maximum participants per group
(define-constant max-participants u100)

;; =============================================================================
;; DATA VARIABLES
;; =============================================================================

;; Global group counter for unique IDs
(define-data-var group-nonce uint u0)

;; Platform fee percentage (1% = 100 basis points)
(define-data-var platform-fee-bps uint u100)

;; =============================================================================
;; DATA MAPS
;; =============================================================================

;; Main group storage
(define-map groups
    { group-id: uint }
    {
        name: (string-utf8 100),
        description: (string-utf8 500),
        creator: principal,
        total-participants: uint,
        contribution-amount: uint,
        frequency: (string-ascii 20),
        duration-months: uint,
        trust-score-required: uint,
        allow-partial: bool,
        current-cycle: uint,
        is-active: bool,
        created-at: uint,
        asset-type: (string-ascii 10) ;; "STX" or "sBTC"
    }
)

;; Participant list per group
(define-map group-participants
    { group-id: uint, participant: principal }
    {
        joined-at: uint,
        trust-score-at-join: uint,
        total-contributed: uint,
        cycles-completed: uint,
        has-received-payout: bool
    }
)

;; Join requests
(define-map join-requests
    { group-id: uint, requester: principal }
    {
        requested-at: uint,
        trust-score: uint
    }
)

;; Cycle contributions tracking
(define-map cycle-contributions
    { group-id: uint, participant: principal, cycle: uint }
    {
        amount-contributed: uint,
        contributed-at: uint,
        is-complete: bool
    }
)

;; User trust scores
(define-map trust-scores
    { user: principal }
    {
        score: uint,
        total-groups-joined: uint,
        total-groups-completed: uint,
        total-contributions: uint,
        last-updated: uint
    }
)

;; Cycle recipient tracking
(define-map cycle-recipients
    { group-id: uint, cycle: uint }
    {
        recipient: principal,
        total-pool-amount: uint,
        distributed-at: uint
    }
)

;; List of all participants for a group (for easier querying)
(define-map group-participant-list
    { group-id: uint }
    {
        participants: (list 100 principal),
        participant-count: uint
    }
)

;; List of join requests for a group
(define-map group-join-request-list
    { group-id: uint }
    {
        requests: (list 50 principal),
        request-count: uint
    }
)

;; Index for groups by creator
(define-map creator-groups
    { creator: principal }
    {
        group-count: uint,
        groups: (list 100 uint)
    }
)

;; =============================================================================
;; PRIVATE FUNCTIONS
;; =============================================================================

;; Calculate trust score for a user
(define-private (calculate-trust-score (user principal))
    (let (
        (user-data (default-to 
            { score: u50, total-groups-joined: u0, total-groups-completed: u0, total-contributions: u0, last-updated: u0 }
            (map-get? trust-scores { user: user })
        ))
    )
        (get score user-data)
    )
)

;; Update user trust score after completing a cycle
(define-private (update-trust-score-on-contribution (user principal) (amount uint))
    (let (
        (current-data (default-to 
            { score: u50, total-groups-joined: u0, total-groups-completed: u0, total-contributions: u0, last-updated: burn-block-height }
            (map-get? trust-scores { user: user })
        ))
        (new-score (+ (get score current-data) u1))
        (new-total-contributions (+ (get total-contributions current-data) amount))
    )
        (map-set trust-scores
            { user: user }
            {
                score: (if (> new-score u100) u100 new-score),
                total-groups-joined: (get total-groups-joined current-data),
                total-groups-completed: (get total-groups-completed current-data),
                total-contributions: new-total-contributions,
                last-updated: burn-block-height
            }
        )
        true
    )
)

;; Decrease trust score for missing contributions
(define-private (decrease-trust-score (user principal) (penalty uint))
    (let (
        (current-data (default-to 
            { score: u50, total-groups-joined: u0, total-groups-completed: u0, total-contributions: u0, last-updated: burn-block-height }
            (map-get? trust-scores { user: user })
        ))
        (current-score (get score current-data))
        (new-score (if (> current-score penalty) (- current-score penalty) u0))
    )
        (map-set trust-scores
            { user: user }
            (merge current-data { score: new-score, last-updated: burn-block-height })
        )
        true
    )
)

;; Validate group parameters
(define-private (validate-group-params (total-participants uint) (contribution-amount uint) (duration-months uint))
    (and
        (> total-participants u1)
        (<= total-participants max-participants)
        (>= contribution-amount min-contribution-amount)
        (> duration-months u0)
        (<= duration-months u60)
    )
)

;; =============================================================================
;; PUBLIC FUNCTIONS - GROUP MANAGEMENT
;; =============================================================================

;; Create a new savings group
(define-public (create-group
    (name (string-utf8 100))
    (description (string-utf8 500))
    (total-participants uint)
    (contribution-amount uint)
    (frequency (string-ascii 20))
    (duration-months uint)
    (trust-score-required uint)
    (allow-partial bool)
    (asset-type (string-ascii 10))
)
    (let (
        (group-id (+ (var-get group-nonce) u1))
        (creator tx-sender)
    )
        ;; Validate parameters
        (asserts! (validate-group-params total-participants contribution-amount duration-months) err-invalid-group-parameters)
        (asserts! (<= trust-score-required u100) err-invalid-group-parameters)
        
        ;; Create the group
        (map-set groups
            { group-id: group-id }
            {
                name: name,
                description: description,
                creator: creator,
                total-participants: total-participants,
                contribution-amount: contribution-amount,
                frequency: frequency,
                duration-months: duration-months,
                trust-score-required: trust-score-required,
                allow-partial: allow-partial,
                current-cycle: u1,
                is-active: true,
                created-at: burn-block-height,
                asset-type: asset-type
            }
        )
        
        ;; Initialize participant list
        (map-set group-participant-list
            { group-id: group-id }
            { participants: (list), participant-count: u0 }
        )
        
        ;; Initialize join request list
        (map-set group-join-request-list
            { group-id: group-id }
            { requests: (list), request-count: u0 }
        )
        
        ;; Auto-add creator as first participant
        (map-set group-participants
            { group-id: group-id, participant: creator }
            {
                joined-at: burn-block-height,
                trust-score-at-join: (calculate-trust-score creator),
                total-contributed: u0,
                cycles-completed: u0,
                has-received-payout: false
            }
        )
        
        ;; Update participant list
        (map-set group-participant-list
            { group-id: group-id }
            { participants: (list creator), participant-count: u1 }
        )
        
        ;; Increment nonce
        (var-set group-nonce group-id)
        
        ;; Update creator's trust score
        (let (
            (creator-data (default-to 
                { score: u50, total-groups-joined: u1, total-groups-completed: u0, total-contributions: u0, last-updated: burn-block-height }
                (map-get? trust-scores { user: creator })
            ))
        )
            (map-set trust-scores
                { user: creator }
                {
                    score: (get score creator-data),
                    total-groups-joined: (+ (get total-groups-joined creator-data) u1),
                    total-groups-completed: (get total-groups-completed creator-data),
                    total-contributions: (get total-contributions creator-data),
                    last-updated: burn-block-height
                }
            )
        )
        
        ;; Update creator's group index
        (let (
            (creator-data (default-to 
                { group-count: u0, groups: (list) }
                (map-get? creator-groups { creator: creator })
            ))
        )
            (map-set creator-groups
                { creator: creator }
                {
                    group-count: (+ (get group-count creator-data) u1),
                    groups: (unwrap-panic (as-max-len? (append (get groups creator-data) group-id) u100))
                }
            )
        )
        
        (ok group-id)
    )
)

;; Request to join a group
(define-public (request-to-join-group (group-id uint))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
        (requester tx-sender)
        (user-trust-score (calculate-trust-score requester))
        (participant-list (unwrap! (map-get? group-participant-list { group-id: group-id }) err-group-not-found))
        (request-list (unwrap! (map-get? group-join-request-list { group-id: group-id }) err-group-not-found))
    )
        ;; Validations
        (asserts! (get is-active group) err-group-inactive)
        (asserts! (< (get participant-count participant-list) (get total-participants group)) err-group-full)
        (asserts! (>= user-trust-score (get trust-score-required group)) err-insufficient-trust-score)
        (asserts! (is-none (map-get? group-participants { group-id: group-id, participant: requester })) err-already-participant)
        (asserts! (is-none (map-get? join-requests { group-id: group-id, requester: requester })) err-already-participant)
        
        ;; Add join request
        (map-set join-requests
            { group-id: group-id, requester: requester }
            {
                requested-at: burn-block-height,
                trust-score: user-trust-score
            }
        )
        
        ;; Update request list
        (map-set group-join-request-list
            { group-id: group-id }
            {
                requests: (unwrap-panic (as-max-len? (append (get requests request-list) requester) u50)),
                request-count: (+ (get request-count request-list) u1)
            }
        )
        
        (ok true)
    )
)

;; Approve a join request (creator only)
(define-public (approve-join-request (group-id uint) (requester principal))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
        (join-request (unwrap! (map-get? join-requests { group-id: group-id, requester: requester }) err-join-request-not-found))
        (participant-list (unwrap! (map-get? group-participant-list { group-id: group-id }) err-group-not-found))
    )
        ;; Only creator can approve
        (asserts! (is-eq tx-sender (get creator group)) err-not-authorized)
        (asserts! (< (get participant-count participant-list) (get total-participants group)) err-group-full)
        
        ;; Add participant
        (map-set group-participants
            { group-id: group-id, participant: requester }
            {
                joined-at: burn-block-height,
                trust-score-at-join: (get trust-score join-request),
                total-contributed: u0,
                cycles-completed: u0,
                has-received-payout: false
            }
        )
        
        ;; Update participant list
        (map-set group-participant-list
            { group-id: group-id }
            {
                participants: (unwrap-panic (as-max-len? (append (get participants participant-list) requester) u100)),
                participant-count: (+ (get participant-count participant-list) u1)
            }
        )
        
        ;; Remove join request
        (map-delete join-requests { group-id: group-id, requester: requester })
        
        ;; Update user's trust score stats
        (let (
            (user-data (default-to 
                { score: u50, total-groups-joined: u1, total-groups-completed: u0, total-contributions: u0, last-updated: burn-block-height }
                (map-get? trust-scores { user: requester })
            ))
        )
            (map-set trust-scores
                { user: requester }
                {
                    score: (get score user-data),
                    total-groups-joined: (+ (get total-groups-joined user-data) u1),
                    total-groups-completed: (get total-groups-completed user-data),
                    total-contributions: (get total-contributions user-data),
                    last-updated: burn-block-height
                }
            )
        )
        
        (ok true)
    )
)

;; Deny a join request (creator only)
(define-public (deny-join-request (group-id uint) (requester principal))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
    )
        ;; Only creator can deny
        (asserts! (is-eq tx-sender (get creator group)) err-not-authorized)
        (asserts! (is-some (map-get? join-requests { group-id: group-id, requester: requester })) err-join-request-not-found)
        
        ;; Remove join request
        (map-delete join-requests { group-id: group-id, requester: requester })
        
        (ok true)
    )
)

;; =============================================================================
;; PUBLIC FUNCTIONS - CONTRIBUTIONS
;; =============================================================================

;; Make a contribution to a group
(define-public (contribute (group-id uint) (amount uint))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
        (contributor tx-sender)
        (current-cycle (get current-cycle group))
        (participant (unwrap! (map-get? group-participants { group-id: group-id, participant: contributor }) err-not-participant))
        (cycle-contribution (map-get? cycle-contributions { group-id: group-id, participant: contributor, cycle: current-cycle }))
    )
        ;; Validations
        (asserts! (get is-active group) err-group-inactive)
        (asserts! (>= amount min-contribution-amount) err-contribution-below-minimum)
        
        ;; Check if partial payments are allowed
        (if (get allow-partial group)
            ;; Partial payments allowed - can contribute any amount >= minimum
            (asserts! (>= amount min-contribution-amount) err-contribution-below-minimum)
            ;; Full payment required
            (asserts! (is-eq amount (get contribution-amount group)) err-partial-payment-not-allowed)
        )
        
        ;; Calculate total contributed in this cycle
        (let (
            (existing-contribution (default-to { amount-contributed: u0, contributed-at: u0, is-complete: false } cycle-contribution))
            (previous-contribution (get amount-contributed existing-contribution))
            (new-total (+ previous-contribution amount))
            (is-complete (>= new-total (get contribution-amount group)))
        )
            ;; Transfer STX to contract
            (try! (stx-transfer? amount contributor (as-contract tx-sender)))
            
            ;; Update cycle contribution
            (map-set cycle-contributions
                { group-id: group-id, participant: contributor, cycle: current-cycle }
                {
                    amount-contributed: new-total,
                    contributed-at: burn-block-height,
                    is-complete: is-complete
                }
            )
            
            ;; Update participant stats if cycle complete
            (if is-complete
                (begin
                    (map-set group-participants
                        { group-id: group-id, participant: contributor }
                        (merge participant 
                            { 
                                total-contributed: (+ (get total-contributed participant) new-total),
                                cycles-completed: (+ (get cycles-completed participant) u1)
                            }
                        )
                    )
                    (update-trust-score-on-contribution contributor amount)
                )
                true
            )
            
            (ok { contributed: amount, total-this-cycle: new-total, is-complete: is-complete })
        )
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get group details by ID
(define-read-only (get-group (group-id uint))
    (ok (map-get? groups { group-id: group-id }))
)

;; Get total group count
(define-read-only (get-group-count)
    (ok (var-get group-nonce))
)

;; Get groups by creator - returns actual group data
(define-read-only (get-groups-by-creator (creator principal))
    (let (
        (creator-data (default-to 
            { group-count: u0, groups: (list) }
            (map-get? creator-groups { creator: creator })
        ))
        (group-ids (get groups creator-data))
    )
        ;; Return the group IDs - frontend will fetch individual groups
        (ok group-ids)
    )
)

;; Get all groups (paginated) - returns actual group data
(define-read-only (get-paginated-groups (page uint) (page-size uint))
    (let (
        (total-count (var-get group-nonce))
        (group-1 (map-get? groups { group-id: u1 }))
        (group-2 (map-get? groups { group-id: u2 }))
        (group-3 (map-get? groups { group-id: u3 }))
        (group-4 (map-get? groups { group-id: u4 }))
        (group-5 (map-get? groups { group-id: u5 }))
        (group-6 (map-get? groups { group-id: u6 }))
        (group-7 (map-get? groups { group-id: u7 }))
        (group-8 (map-get? groups { group-id: u8 }))
        (group-9 (map-get? groups { group-id: u9 }))
        (group-10 (map-get? groups { group-id: u10 }))
    )
        ;; For now, return all groups - frontend can handle pagination
        ;; In production, implement proper pagination with a more efficient approach
        (ok {
            groups: (if (is-some group-1)
                (if (is-some group-2)
                    (if (is-some group-3)
                        (list group-1 group-2 group-3 group-4 group-5 group-6 group-7 group-8 group-9 group-10)
                        (list group-1 group-2))
                    (list group-1))
                (list)),
            total-count: total-count,
            page: page,
            page-size: page-size
        })
    )
)

;; Get participant cycle status
(define-read-only (get-participant-cycle-status (group-id uint) (participant principal))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
        (current-cycle (get current-cycle group))
        (contribution (default-to 
            { amount-contributed: u0, contributed-at: u0, is-complete: false }
            (map-get? cycle-contributions { group-id: group-id, participant: participant, cycle: current-cycle })
        ))
        (required-amount (get contribution-amount group))
    )
        (ok {
            contributed-this-cycle: (get amount-contributed contribution),
            remaining-this-cycle: (if (>= (get amount-contributed contribution) required-amount)
                u0
                (- required-amount (get amount-contributed contribution))
            ),
            is-complete: (get is-complete contribution)
        })
    )
)

;; Get user trust score
(define-read-only (get-trust-score (user principal))
    (ok (calculate-trust-score user))
)

;; Get trust score details
(define-read-only (get-trust-score-details (user principal))
    (ok (map-get? trust-scores { user: user }))
)

;; Get join requests for a group
(define-read-only (get-join-requests (group-id uint))
    (let (
        (request-list (unwrap! (map-get? group-join-request-list { group-id: group-id }) err-group-not-found))
    )
        (ok (get requests request-list))
    )
)

;; Get participants for a group
(define-read-only (get-group-participants (group-id uint))
    (let (
        (participant-list (unwrap! (map-get? group-participant-list { group-id: group-id }) err-group-not-found))
    )
        (ok (get participants participant-list))
    )
)

;; Check if user is participant
(define-read-only (is-participant (group-id uint) (user principal))
    (ok (is-some (map-get? group-participants { group-id: group-id, participant: user })))
)

;; Get participant details
(define-read-only (get-participant-details (group-id uint) (participant principal))
    (ok (map-get? group-participants { group-id: group-id, participant: participant }))
)

;; Get platform fee
(define-read-only (get-platform-fee-bps)
    (ok (var-get platform-fee-bps))
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Update platform fee (owner only)
(define-public (set-platform-fee-bps (new-fee-bps uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-fee-bps u1000) err-invalid-group-parameters) ;; Max 10%
        (var-set platform-fee-bps new-fee-bps)
        (ok true)
    )
)

;; Emergency pause a group (owner only)
(define-public (pause-group (group-id uint))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set groups
            { group-id: group-id }
            (merge group { is-active: false })
        )
        (ok true)
    )
)

;; Reactivate a paused group (owner only)
(define-public (reactivate-group (group-id uint))
    (let (
        (group (unwrap! (map-get? groups { group-id: group-id }) err-group-not-found))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set groups
            { group-id: group-id }
            (merge group { is-active: true })
        )
        (ok true)
    )
)
