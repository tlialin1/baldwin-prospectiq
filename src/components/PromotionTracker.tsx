import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, StepContent,
  LinearProgress, Chip, Card, CardContent, CircularProgress
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon
} from '@mui/icons-material';

interface PromotionLevel {
  rank: string;
  requirements: string[];
  completed: boolean[];
  score_threshold: number;
}

const PromotionTracker: React.FC = () => {
  const [levels, setLevels] = useState<PromotionLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(2);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLevels([
        {
          rank: 'Associate Agent',
          requirements: [
            'Complete onboarding training',
            'Upload first 10 policies',
            'Achieve Book Relevance Score of 50+'
          ],
          completed: [true, true, true],
          score_threshold: 50
        },
        {
          rank: 'Senior Agent',
          requirements: [
            'Maintain 50+ active policies',
            'Achieve Agent Effectiveness Score of 70+',
            'Complete advanced training module'
          ],
          completed: [true, true, true],
          score_threshold: 70
        },
        {
          rank: 'Team Leader',
          requirements: [
            'Recruit 3 new agents',
            'Achieve Book Relevance Score of 80+',
            'Maintain 100+ active policies',
            'Complete leadership training'
          ],
          completed: [false, false, true, false],
          score_threshold: 80
        },
        {
          rank: 'Agency Manager',
          requirements: [
            'Build team of 10+ agents',
            'Achieve combined book premium of $50K/month',
            'Maintain personal Book Relevance Score of 85+'
          ],
          completed: [false, false, false],
          score_threshold: 85
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const getProgress = (level: PromotionLevel) => {
    const completed = level.completed.filter(Boolean).length;
    return (completed / level.requirements.length) * 100;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Promotion Tracker
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Progress
        </Typography>
        <Box display="flex" alignItems="center" mb={2}>
          <Chip
            label={levels[currentLevel]?.rank || 'Loading...'}
            color="primary"
            sx={{ mr: 2 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={getProgress(levels[currentLevel])}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2" sx={{ ml: 2 }}>
            {Math.round(getProgress(levels[currentLevel]))}%
          </Typography>
        </Box>
      </Paper>

      <Stepper orientation="vertical" activeStep={currentLevel}>
        {levels.map((level, index) => (
          <Step key={level.rank} completed={index < currentLevel}>
            <StepLabel
              StepIconComponent={index <= currentLevel ? CheckCircleIcon : UncheckedIcon}
            >
              <Typography variant="h6">{level.rank}</Typography>
              <Typography variant="body2" color="text.secondary">
                Score Threshold: {level.score_threshold}+
              </Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {level.requirements.map((req, reqIndex) => (
                  <Card key={reqIndex} sx={{ mb: 1, bgcolor: level.completed[reqIndex] ? 'success.light' : 'background.paper' }}>
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                      <Box display="flex" alignItems="center">
                        {level.completed[reqIndex] ? (
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        ) : (
                          <UncheckedIcon color="disabled" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="body2">{req}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default PromotionTracker;
