import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colorScheme } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { ArrowRight, Train } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Train {
  id: string;
  number: string;
  name: string;
}

export default function TrainSelection() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  const [loading, setLoading] = useState(true);
  const [trains, setTrains] = useState<Train[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [customTrainNumber, setCustomTrainNumber] = useState('');
  const [customTrainName, setCustomTrainName] = useState('');
  
  // Extra security check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);
  
  // Fetch train data on component mount
  useEffect(() => {
    fetchTrains();
  }, []);
  
  // Fetch trains from the database
  const fetchTrains = async () => {
    try {
      setLoading(true);
      
      // Fetch trains from the database
      const { data, error } = await supabase
        .from('trains')
        .select('*')
        .order('number', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // If no trains in database yet, use a default list
      if (!data || data.length === 0) {
        // Sample train data
        const sampleTrains = [
          { id: '1', number: '12301', name: 'Howrah Rajdhani Express' },
          { id: '2', number: '12302', name: 'New Delhi Rajdhani Express' },
          { id: '3', number: '12951', name: 'Mumbai Rajdhani Express' },
          { id: '4', number: '12952', name: 'New Delhi Rajdhani Express' },
          { id: '5', number: '12309', name: 'Rajendra Nagar Rajdhani Express' },
          { id: '6', number: '12310', name: 'New Delhi Rajdhani Express' },
          { id: '7', number: '12305', name: 'Howrah Rajdhani Express' },
          { id: '8', number: '12306', name: 'New Delhi Rajdhani Express' },
          { id: '9', number: '22691', name: 'Rajdhani Express' },
          { id: '10', number: '22692', name: 'Rajdhani Express' },
        ];
        setTrains(sampleTrains);
      } else {
        setTrains(data);
      }
    } catch (error) {
      console.error('Error fetching trains:', error);
      Alert.alert('Error', 'Failed to load train data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter trains based on search query
  const filteredTrains = trains.filter(train => 
    train.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    train.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle train selection
  const handleTrainSelect = (train: Train) => {
    setSelectedTrain(train);
    setCustomTrainNumber(train.number);
    setCustomTrainName(train.name);
  };
  
  // Handle proceeding to trip report
  const handleProceedToReport = () => {
    // Validate train number
    if (!customTrainNumber.trim()) {
      Alert.alert('Error', 'Please enter a train number');
      return;
    }
    
    // Validate train name (optional but recommended)
    if (!customTrainName.trim()) {
      Alert.alert(
        'Missing Train Name', 
        'Train name is recommended for better identification. Do you want to proceed without it?',
        [
          {
            text: 'Add Train Name',
            style: 'cancel'
          },
          {
            text: 'Proceed Anyway',
            onPress: () => navigateToTripReport()
          }
        ]
      );
      return;
    }
    
    // If all validations pass, proceed
    navigateToTripReport();
  };
  
  // Function to navigate to trip report
  const navigateToTripReport = () => {
    try {
      // Store train info in local storage for more reliable parameter passing
      // This helps ensure the data is available even if URL parameters fail
      try {
        localStorage.setItem('selectedTrainNumber', customTrainNumber.trim());
        localStorage.setItem('selectedTrainName', customTrainName.trim());
      } catch (storageError) {
        console.log('Could not store in localStorage, continuing with params only');
      }
      
      // Use replace instead of push to avoid navigation stack issues
      router.replace({
        pathname: '/trips',
        params: {
          trainNumber: customTrainNumber.trim(),
          trainName: customTrainName.trim(),
          timestamp: new Date().getTime() // Add timestamp to prevent caching issues
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to trip report. Please try again.');
    }
  };
  
  return (
    <StyledView style={styles.container}>
      <View style={styles.headerContainer}>
        <StyledText size="xl" weight="bold">Select Train</StyledText>
        <StyledText size="sm" style={{ marginTop: 5 }}>
          Choose a train for your inspection report
        </StyledText>
      </View>
      
      {/* Search input */}
      <Card style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by train number or name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </Card>
      
      {/* Train selection */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={themeColors.tabBarActiveIcon} />
        </View>
      ) : (
        <ScrollView style={styles.trainList}>
          {filteredTrains.map((train) => (
            <TouchableOpacity
              key={train.id}
              style={[
                styles.trainItem,
                selectedTrain?.id === train.id && styles.selectedTrainItem
              ]}
              onPress={() => handleTrainSelect(train)}
            >
              <View style={styles.trainIcon}>
                <Train size={24} color={themeColors.text} />
              </View>
              <View style={styles.trainInfo}>
                <StyledText weight="bold">{train.number}</StyledText>
                <StyledText size="sm">{train.name}</StyledText>
              </View>
              {selectedTrain?.id === train.id && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Custom train input */}
      <Card style={styles.customTrainCard}>
        <StyledText weight="bold" style={styles.customTrainLabel}>
          Train Details
        </StyledText>
        
        <View style={styles.inputRow}>
          <StyledText size="sm" style={styles.inputLabel}>Train Number:</StyledText>
          <TextInput
            style={styles.customInput}
            value={customTrainNumber}
            onChangeText={setCustomTrainNumber}
            placeholder="Enter train number"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.inputRow}>
          <StyledText size="sm" style={styles.inputLabel}>Train Name:</StyledText>
          <TextInput
            style={styles.customInput}
            value={customTrainName}
            onChangeText={setCustomTrainName}
            placeholder="Enter train name"
            placeholderTextColor="#999"
          />
        </View>
      </Card>
      
      {/* Proceed button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            !customTrainNumber.trim() && styles.disabledButton
          ]}
          onPress={handleProceedToReport}
          disabled={!customTrainNumber.trim()}
        >
          <StyledText size="md" weight="bold" style={styles.buttonText}>
            Proceed to Report
          </StyledText>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCard: {
    marginBottom: 16,
    padding: 8,
  },
  searchInput: {
    height: 40,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    padding: 8,
  },
  trainList: {
    flex: 1,
    marginBottom: 16,
  },
  trainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: 'white',
  },
  selectedTrainItem: {
    backgroundColor: '#f0f7ff',
  },
  trainIcon: {
    marginRight: 16,
  },
  trainInfo: {
    flex: 1,
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
  },
  customTrainCard: {
    padding: 16,
    marginBottom: 16,
  },
  customTrainLabel: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    width: 100,
  },
  customInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontFamily: 'Inter-Regular',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  proceedButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    marginRight: 8,
  },
});
