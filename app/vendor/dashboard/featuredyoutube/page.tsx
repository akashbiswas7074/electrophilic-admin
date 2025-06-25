'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  LoadingOverlay,
  Alert as MantineAlert,
  Group,
  Modal,
  Paper,
  Title,
  Text,
  Table,
  Switch,
  ActionIcon,
  Tooltip,
  Box,
  Stack,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  getAllFeaturedVideosForAdmin,
  addFeaturedVideo,
  updateFeaturedVideo,
  deleteFeaturedVideo,
} from '@/lib/database/actions/admin/featuredvideo/featured.video.actions';
import { IFeaturedVideo } from '@/lib/database/models/featured.video.model';
import { AlertCircle, CheckCircle, Edit, Plus, Trash2, Youtube } from 'lucide-react';

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const FeaturedVideoPage = () => {
  const [videos, setVideos] = useState<IFeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpened, setModalOpened] = useState(false);
  const [currentVideoToEdit, setCurrentVideoToEdit] = useState<IFeaturedVideo | null>(null);
  
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [videoToDeleteId, setVideoToDeleteId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      youtubeLink: '',
      description: '',
      isActive: true,
    },
    validate: {
      youtubeLink: (value) => {
        if (!value.trim()) return 'YouTube link is required';
        if (!getYouTubeVideoId(value)) return 'Invalid YouTube link format. Must be a valid video URL.';
        return null;
      },
      description: (value) => (value.trim() ? null : 'Description is required'),
    },
  });

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllFeaturedVideosForAdmin();
      if (result.success && result.videos) {
        setVideos(result.videos);
      } else {
        setError(result.message || 'Failed to fetch videos.');
        setVideos([]);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while fetching videos.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleOpenModal = (video?: IFeaturedVideo) => {
    if (video) {
      setCurrentVideoToEdit(video);
      form.setValues({
        youtubeLink: video.youtubeLink,
        description: video.description,
        isActive: video.isActive,
      });
    } else {
      setCurrentVideoToEdit(null);
      form.reset();
    }
    setModalOpened(true);
  };

  const handleFormSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    setError(null);
    try {
      let result;
      if (currentVideoToEdit) {
        result = await updateFeaturedVideo(currentVideoToEdit._id as string, values);
      } else {
        result = await addFeaturedVideo(values.youtubeLink, values.description, values.isActive);
      }

      if (result.success) {
        notifications.show({
          title: 'Success',
          message: result.message,
          color: 'green',
          icon: <CheckCircle />,
        });
        setModalOpened(false);
        fetchVideos(); // Refresh the list
      } else {
        setError(result.message || 'Failed to save video.');
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to save video.',
          color: 'red',
          icon: <AlertCircle />,
        });
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      notifications.show({
        title: 'Error',
        message: e.message || 'An unexpected error occurred.',
        color: 'red',
        icon: <AlertCircle />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirmModal = (videoId: string) => {
    setVideoToDeleteId(videoId);
    setDeleteModalOpened(true);
  };

  const handleDeleteVideo = async () => {
    if (!videoToDeleteId) return;
    setSubmitting(true); // Use submitting state for delete operation as well
    setError(null);
    try {
      const result = await deleteFeaturedVideo(videoToDeleteId);
      if (result.success) {
        notifications.show({
          title: 'Success',
          message: result.message,
          color: 'green',
          icon: <CheckCircle />,
        });
        fetchVideos(); // Refresh the list
      } else {
        setError(result.message || 'Failed to delete video.');
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to delete video.',
          color: 'red',
          icon: <AlertCircle />,
        });
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during deletion.');
      notifications.show({
        title: 'Error',
        message: e.message || 'An unexpected error occurred during deletion.',
        color: 'red',
        icon: <AlertCircle />,
      });
    } finally {
      setSubmitting(false);
      setDeleteModalOpened(false);
      setVideoToDeleteId(null);
    }
  };

  const rows = videos.map((video) => {
    const videoId = getYouTubeVideoId(video.youtubeLink);
    return (
      <Table.Tr key={video._id}>
        <Table.Td>
          {videoId ? (
            <Box w={120} h={67.5} style={{ overflow: 'hidden', borderRadius: '4px', background: '#000' }}>
              <img 
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                alt={video.description.substring(0,30)} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ) : (
            <Text size="sm" c="dimmed">Invalid Link</Text>
          )}
        </Table.Td>
        <Table.Td>
            <Text fw={500} lineClamp={1}>{video.description}</Text>
            <Text size="xs" c="dimmed" lineClamp={1}>{video.youtubeLink}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={video.isActive ? 'green' : 'gray'} variant="light">
            {video.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{new Date(video.createdAt).toLocaleDateString()}</Text>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Tooltip label="Edit Video">
              <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenModal(video)}>
                <Edit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete Video">
              <ActionIcon variant="subtle" color="red" onClick={() => openDeleteConfirmModal(video._id)}>
                <Trash2 size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Paper shadow="sm" p="lg" withBorder>
      <LoadingOverlay visible={loading && videos.length === 0} />
      
      <Group justify="space-between" mb="xl">
        <Title order={2}>Manage Featured Videos</Title>
        <Button leftSection={<Plus size={16} />} onClick={() => handleOpenModal()}>
          Add New Video
        </Button>
      </Group>

      {error && !modalOpened && ( // Only show general error if modal is not open, as modal has its own error display
        <MantineAlert icon={<AlertCircle size={16} />} title="Error" color="red" withCloseButton onClose={() => setError(null)} mb="md">
          {error}
        </MantineAlert>
      )}

      {videos.length === 0 && !loading && !error && (
        <Text c="dimmed" ta="center" py="xl">No featured videos found. Click "Add New Video" to get started.</Text>
      )}

      {videos.length > 0 && (
        <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm" striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                <Table.Th>Preview</Table.Th>
                <Table.Th>Description & Link</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Table.ScrollContainer>
      )}

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setCurrentVideoToEdit(null);
          form.reset(); // Reset form when closing
          setError(null); // Clear modal-specific errors
        }}
        title={currentVideoToEdit ? 'Edit Featured Video' : 'Add New Featured Video'}
        centered
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleFormSubmit)}>
          <Stack>
            {error && modalOpened && ( // Show error inside modal if it's open
              <MantineAlert icon={<AlertCircle size={16} />} title="Error" color="red" withCloseButton onClose={() => setError(null)} mb="sm">
                {error}
              </MantineAlert>
            )}
            <TextInput
              label="YouTube Video Link"
              placeholder="Enter YouTube URL (e.g. https://youtube.com/watch?v=VIDEO_ID)"
              {...form.getInputProps('youtubeLink')}
              leftSection={<Youtube size={16}/>}
              required
            />
            <Textarea
              label="Description"
              placeholder="A short description for the video"
              {...form.getInputProps('description')}
              required
              minRows={3}
            />
            <Switch
              label="Active (visible on public site)"
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {currentVideoToEdit ? 'Update Video' : 'Add Video'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
            setDeleteModalOpened(false);
            setVideoToDeleteId(null);
        }}
        title="Confirm Deletion"
        centered
        size="sm"
      >
        <Text>Are you sure you want to delete this featured video? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteVideo} loading={submitting}>
            Delete Video
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
};

export default FeaturedVideoPage;
