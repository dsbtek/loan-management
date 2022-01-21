const ActivityController = require('../../controller/activity-logs');
const express = require('express');

const router = express.Router();

router.get('/', ActivityController.getActivities);
router.get('/lists', ActivityController.getActivityList);
router.get('/:id', ActivityController.getActivity);



module.exports = router;
