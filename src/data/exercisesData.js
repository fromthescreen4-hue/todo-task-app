/**
 * exercisesData.js — CORE FIT Exercise Catalog & Biomechanical Form Guides
 * Covers all 11 categories with anatomical cues, breathing mechanics, and animated vector diagrams.
 */

export const EXERCISE_CATEGORIES = [
  'All',
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Push',
  'Pull',
  'Legs',
  'Chest & Triceps',
  'Back & Biceps',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Mobility & Recovery'
];

export const EXERCISES = [
  // ── CHEST & TRICEPS / PUSH ──
  {
    id: 'barbell-bench-press',
    name: 'Barbell Flat Bench Press',
    categories: ['Upper Body', 'Push', 'Chest & Triceps'],
    primaryMuscle: 'Pectoralis Major',
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
    equipment: 'Barbell',
    level: 'Intermediate',
    cues: {
      stance: 'Lie flat with eyes beneath the racked bar. Plant feet firmly flat on the floor with active quadriceps drive. Maintain a gentle natural lumbar arch with shoulder blades retracted and depressed into the pad.',
      grip: 'Grip slightly wider than shoulder-width with a closed, full thumb wrap. Keep wrists straight directly stacked over forearms.',
      breathing: 'Deep diaphragmatic breath into the belly at the top. Brace intra-abdominal pressure. Lower under control to lower sternum. Exhale forcefully through the sticking point.',
      mistakes: [
        'Flaring elbows out to 90 degrees (tuck elbows 45-70 degrees to protect rotators)',
        'Bouncing the barbell off the chest for momentum',
        'Lifting buttocks off the bench during the lockout drive',
        'Allowing wrists to collapse backward under load'
      ]
    },
    svgType: 'bench'
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press (30°)',
    categories: ['Upper Body', 'Push', 'Chest & Triceps'],
    primaryMuscle: 'Clavicular Pectoralis (Upper Chest)',
    secondaryMuscles: ['Anterior Deltoids', 'Triceps'],
    equipment: 'Dumbbells',
    level: 'Beginner to Advanced',
    cues: {
      stance: 'Set bench to 30 degrees. Kick dumbbells to shoulders using knees. Plant feet firmly. Keep scapulae pinched together.',
      grip: 'Slightly angled 45-degree semi-pronated grip. Stack wrists above elbows.',
      breathing: 'Inhale on the descent until dumbbells reach upper chest depth. Press upward and slightly inward while exhaling.',
      mistakes: [
        'Setting incline too steep (> 45 degrees shifts work into anterior deltoids)',
        'Clinking dumbbells together at the top, losing tension',
        'Dropping elbows below safe shoulder plane'
      ]
    },
    svgType: 'incline'
  },
  {
    id: 'tricep-rope-pushdown',
    name: 'Cable Triceps Rope Pushdown',
    categories: ['Upper Body', 'Push', 'Arms', 'Chest & Triceps'],
    primaryMuscle: 'Triceps Brachii (Lateral & Medial Heads)',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    level: 'Beginner',
    cues: {
      stance: 'Stand tall with slight forward hinge at hips. Pin elbows firmly to the sides of the ribcage throughout the movement.',
      grip: 'Neutral grip on rope attachment, thumbs near the top knots.',
      breathing: 'Exhale while pressing down and flaring rope ends outward at full contraction. Inhale as you return up to 90 degrees.',
      mistakes: [
        'Allowing elbows to drift forward and backward (cheating with lats)',
        'Using body momentum / bobbing torso up and down',
        'Failing to reach full elbow lockout at the bottom'
      ]
    },
    svgType: 'arms'
  },

  // ── BACK & BICEPS / PULL ──
  {
    id: 'barbell-deadlift',
    name: 'Conventional Barbell Deadlift',
    categories: ['Full Body', 'Lower Body', 'Pull'],
    primaryMuscle: 'Posterior Chain (Glutes, Hamstrings, Erector Spinae)',
    secondaryMuscles: ['Latissimus Dorsi', 'Trapezius', 'Core'],
    equipment: 'Barbell',
    level: 'Advanced',
    cues: {
      stance: 'Feet hip-width apart with bar over mid-foot (1 inch from shins). Hinge at hips until shins touch the bar.',
      grip: 'Double overhand or hook grip just outside shins. Pull slack out of the barbell until you hear a click.',
      breathing: 'Brace core with full 360-degree Valsalva breath. Drive floor away through heels and mid-foot. Lock out glutes.',
      mistakes: [
        'Rounding lumbar spine during the initial floor pull',
        'Hyperextending lower back at the top lockout',
        'Letting the barbell drift away from shins during ascent'
      ]
    },
    svgType: 'deadlift'
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown (Wide Grip)',
    categories: ['Upper Body', 'Pull', 'Back & Biceps'],
    primaryMuscle: 'Latissimus Dorsi',
    secondaryMuscles: ['Biceps Brachii', 'Rhomboids', 'Rear Delts'],
    equipment: 'Cable',
    level: 'Beginner',
    cues: {
      stance: 'Sit with thighs wedged snugly under foam pads. Maintain a tall chest with a slight 10-15 degree backward lean.',
      grip: 'Overhand grip 1.5x shoulder width. Lead with elbows driving down toward back pockets.',
      breathing: 'Exhale as you pull bar smoothly to collarbone. Pause for 1 second. Inhale as arms extend back up under control.',
      mistakes: [
        'Swinging torso excessively backward like a row',
        'Pulling bar behind the neck (stresses cervical spine)',
        'Shrugging shoulders upward during pull'
      ]
    },
    svgType: 'pull'
  },
  {
    id: 'barbell-bicep-curl',
    name: 'Barbell Standing Bicep Curl',
    categories: ['Upper Body', 'Pull', 'Arms', 'Back & Biceps'],
    primaryMuscle: 'Biceps Brachii',
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
    equipment: 'Barbell',
    level: 'Beginner',
    cues: {
      stance: 'Stand shoulder-width apart, knees slightly unlocked, glutes and abs braced to eliminate torso sway.',
      grip: 'Supinated grip shoulder-width apart. Keep upper arms glued to the sides of the torso.',
      breathing: 'Exhale while curling upward to upper chest level. Squeeze biceps hard for 1 second. Inhale on eccentric lower.',
      mistakes: [
        'Swinging hips forward to heave the barbell up',
        'Letting elbows flare outward or drift forward excessively',
        'Dropping weight quickly on eccentric without control'
      ]
    },
    svgType: 'arms'
  },

  // ── LEGS / LOWER BODY ──
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    categories: ['Full Body', 'Lower Body', 'Legs'],
    primaryMuscle: 'Quadriceps Femoris & Gluteus Maximus',
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Core'],
    equipment: 'Barbell',
    level: 'Intermediate',
    cues: {
      stance: 'Feet shoulder-width apart with toes flared out 15-30 degrees. Bar rested across traps (high bar) or rear delts (low bar).',
      grip: 'Hands as close as shoulder mobility allows to pack upper back. Pull elbows down to engage lats.',
      breathing: 'Take big belly breath into abdominal wall. Hinge knees and hips simultaneously. Descend until hip crease is below knee.',
      mistakes: [
        'Allowing knees to cave inward (valgus collapse) on ascent',
        'Weight shifting forward onto toes lifting heels',
        'Rounding lower back into butt-wink under load'
      ]
    },
    svgType: 'squat'
  },
  {
    id: 'romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift (RDL)',
    categories: ['Lower Body', 'Legs', 'Pull'],
    primaryMuscle: 'Hamstrings & Gluteus Maximus',
    secondaryMuscles: ['Erector Spinae', 'Forearms'],
    equipment: 'Dumbbells',
    level: 'Intermediate',
    cues: {
      stance: 'Stand hip-width apart with dumbbells in front of thighs. Soft knee bend maintained at 15-20 degrees throughout.',
      grip: 'Overhand neutral grip. Keep dumbbells in close contact with legs as you push hips backward toward the wall behind you.',
      breathing: 'Inhale and brace before pushing hips back. Feel deep stretch in hamstrings. Drive hips forward while exhaling.',
      mistakes: [
        'Squatting down rather than hinging back at the hips',
        'Rounding lumbar spine to reach lower to the floor',
        'Letting dumbbells drift away from shins'
      ]
    },
    svgType: 'deadlift'
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    categories: ['Lower Body', 'Legs'],
    primaryMuscle: 'Gastrocnemius & Soleus',
    secondaryMuscles: ['Tibialis Posterior'],
    equipment: 'Machine',
    level: 'Beginner',
    cues: {
      stance: 'Balls of feet on block edge, heels hanging free. Keep knees straight but not hyper-extended.',
      grip: 'Hold handles or frame for balance.',
      breathing: 'Lower heels down into full stretch for 2 seconds. Explode up onto balls of feet, squeeze hard at peak for 1 second.',
      mistakes: [
        'Bouncing rapidly at bottom without pause (using Achilles tendon elasticity instead of muscle)',
        'Bending knees to cheat upward'
      ]
    },
    svgType: 'squat'
  },

  // ── SHOULDERS ──
  {
    id: 'overhead-press',
    name: 'Standing Barbell Overhead Press (OHP)',
    categories: ['Upper Body', 'Push', 'Shoulders'],
    primaryMuscle: 'Anterior & Lateral Deltoids',
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    equipment: 'Barbell',
    level: 'Intermediate',
    cues: {
      stance: 'Feet shoulder-width apart. Squeeze glutes and abs tight. Bar resting on anterior deltoids and clavicle.',
      grip: 'Grip just outside shoulder width with vertical forearms.',
      breathing: 'Belly breath and brace. Press bar straight up, pull head back slightly to clear chin, then push head through window at top.',
      mistakes: [
        'Leaning back excessively into a pseudo-incline bench',
        'Pressing the bar in an outward loop instead of vertical line',
        'Flaring ribs and hyperextending spine'
      ]
    },
    svgType: 'ohp'
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    categories: ['Upper Body', 'Push', 'Shoulders'],
    primaryMuscle: 'Lateral Deltoids (Side Delts)',
    secondaryMuscles: ['Supraspinatus', 'Trapezius'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    cues: {
      stance: 'Slight forward torso lean (10 degrees). Soft bend in elbows (15 degrees).',
      grip: 'Neutral to slightly pronated grip with thumbs down or parallel to floor at peak.',
      breathing: 'Exhale while sweeping dumbbells outward in scapular plane (30 degrees forward of midline) to shoulder height.',
      mistakes: [
        'Swinging torso and shrugging traps up to the ears',
        'Leading with wrists rather than elbows',
        'Going heavier than form permits'
      ]
    },
    svgType: 'ohp'
  },

  // ── CORE ──
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Knee / Leg Raise',
    categories: ['Core'],
    primaryMuscle: 'Rectus Abdominis & Hip Flexors',
    secondaryMuscles: ['Obliques', 'Forearms'],
    equipment: 'Bodyweight',
    level: 'Intermediate',
    cues: {
      stance: 'Hang from pull-up bar with dead-hang grip, shoulders engaged.',
      grip: 'Overhand grip shoulder-width apart.',
      breathing: 'Exhale while curling pelvis upward toward ribs. Inhale as legs lower slowly without swinging.',
      mistakes: [
        'Swinging legs for momentum (kipping)',
        'Only flexing hip joints without posterior pelvic tilt'
      ]
    },
    svgType: 'core'
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Kneeling Ab Wheel Rollout',
    categories: ['Core'],
    primaryMuscle: 'Deep Transverse Abdominis & Rectus Abdominis',
    secondaryMuscles: ['Lats', 'Shoulders'],
    equipment: 'Bodyweight',
    level: 'Advanced',
    cues: {
      stance: 'Kneel with knees hip-width on a soft mat, wheel on floor beneath shoulders.',
      grip: 'Overhand firm grip on wheel handles.',
      breathing: 'Round upper back slightly into hollow body. Inhale as you roll wheel forward. Squeeze abs to pull back while exhaling.',
      mistakes: [
        'Letting lower back sag into hyperextension during rollout',
        'Pulling with hips rather than contracting the abs'
      ]
    },
    svgType: 'core'
  },

  // ── CARDIO ──
  {
    id: 'treadmill-incline-walk',
    name: 'Incline Treadmill Walk (Zone 2)',
    categories: ['Cardio', 'Lower Body'],
    primaryMuscle: 'Cardiovascular System',
    secondaryMuscles: ['Calves', 'Glutes', 'Hamstrings'],
    equipment: 'Machine',
    level: 'All Levels',
    cues: {
      stance: 'Incline at 10-15%, speed 4.5-5.5 km/h. Maintain upright posture with natural arm swing.',
      grip: 'Do NOT hold the handrails. Free swinging arms maximize caloric expenditure and core engagement.',
      breathing: 'Nasal or steady rhythmic breathing. Maintain nasal breathability for true Zone 2 aerobic base building.',
      mistakes: [
        'White-knuckling the front handrails (reduces workload by 30-40%)',
        'Slouching forward into the incline'
      ]
    },
    svgType: 'cardio'
  },

  // ── MOBILITY & RECOVERY ──
  {
    id: 'world-greatest-stretch',
    name: "World's Greatest Stretch (Lunge & Thoracic Rotation)",
    categories: ['Mobility & Recovery', 'Full Body'],
    primaryMuscle: 'Hip Flexors, Thoracic Spine, Hamstrings',
    secondaryMuscles: ['Adductors', 'Shoulders'],
    equipment: 'Bodyweight',
    level: 'All Levels',
    cues: {
      stance: 'Step into deep lunge. Place both hands inside front foot. Drop back knee slightly off floor.',
      grip: 'One hand planted firmly on floor.',
      breathing: 'Inhale as you rotate upper chest and arm toward the ceiling. Exhale as you return elbow toward front instep.',
      mistakes: [
        'Allowing front knee to collapse inward',
        'Holding breath during the thoracic rotation'
      ]
    },
    svgType: 'mobility'
  }
];
