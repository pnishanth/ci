import {DOCUMENT} from '@angular/common';
import {async, TestBed} from '@angular/core/testing';
import {Subject} from 'rxjs/Subject';

import {BuildLogWebsocketService} from './build-log-websocket.service';

describe('BuildLogWebsocketService', () => {
  let buildLogWebsocketService: BuildLogWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuildLogWebsocketService,
        {provide: DOCUMENT, useValue: {location: {host: 'host'}}},
      ]
    });

    buildLogWebsocketService = TestBed.get(BuildLogWebsocketService);
  });

  it('should attempt to connect to correct socket', () => {
    const socket = buildLogWebsocketService.createSocket('pId', 'bId');
    socket.close();
    expect(socket.url).toBe('ws://host/data/projects/pId/builds/bId/log.ws');
  });

  describe('socket connection', () => {
    let mockSocket: jasmine.SpyObj<Partial<WebSocket>>;

    beforeEach(() => {
      mockSocket = {close: jasmine.createSpy()};
      spyOn(buildLogWebsocketService, 'createSocket')
          .and.returnValue(mockSocket);
    });

    it('should call observer on message updates', async(() => {
         let data: string;

         buildLogWebsocketService.connect('pId', 'bId').subscribe((message) => {
           data = message.data;
         });

         mockSocket.onmessage(new MessageEvent('fake', {data: 'test'}));
         expect(data).toBe('test');

         mockSocket.onmessage(new MessageEvent('fake', {data: 'test 2'}));
         expect(data).toBe('test 2');
       }));

    it('should emit error to observer on error message', async(() => {
         let event: Event;

         buildLogWebsocketService.connect('pId', 'bId')
             .subscribe(null, (error) => {
               event = error;
             });

         mockSocket.onerror(new Event('error'));
         expect(event.type).toBe('error');
       }));

    it('should emit complete to observer on close message', async(() => {
         let isComplete: boolean;

         buildLogWebsocketService.connect('pId', 'bId')
             .subscribe(null, null, () => {
               isComplete = true;
             });

         mockSocket.onclose();
         expect(isComplete).toBe(true);
       }));

    it('should close socket when observable is unsubscribed', async(() => {
         const observable =
             buildLogWebsocketService.connect('pId', 'bId').subscribe();

         observable.unsubscribe();
         expect(mockSocket.close).toHaveBeenCalled();
       }));
  });
});